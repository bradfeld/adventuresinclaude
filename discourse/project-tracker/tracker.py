#!/usr/bin/env python3
"""
AIC Project Tracker — Webhook listener for Discourse.

Receives post_created/post_edited webhooks from Discourse, extracts
project mentions using Claude, and updates a pinned wiki topic.

Runs on the Discourse droplet (24.144.80.161) as a systemd service.
"""

import hashlib
import hmac
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

import anthropic
import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://community.adventuresinclaude.ai")
DISCOURSE_API_KEY = os.environ["DISCOURSE_API_KEY"]
DISCOURSE_API_USERNAME = os.environ.get("DISCOURSE_API_USERNAME", "bfeld")
DISCOURSE_WEBHOOK_SECRET = os.environ.get("DISCOURSE_WEBHOOK_SECRET", "")
WIKI_POST_ID = int(os.environ.get("WIKI_POST_ID", "0"))  # Set after creating the topic
WIKI_TOPIC_ID = int(os.environ.get("WIKI_TOPIC_ID", "0"))
LISTEN_PORT = int(os.environ.get("TRACKER_PORT", "9100"))
CONFIDENCE_THRESHOLD = 0.7

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("project-tracker")

# ---------------------------------------------------------------------------
# Discourse API helpers
# ---------------------------------------------------------------------------

DISCOURSE_HEADERS = {
    "Api-Key": DISCOURSE_API_KEY,
    "Api-Username": DISCOURSE_API_USERNAME,
    "Content-Type": "application/json",
}


def discourse_get(path: str) -> dict:
    """GET from Discourse API."""
    resp = requests.get(f"{DISCOURSE_URL}{path}", headers=DISCOURSE_HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def discourse_put(path: str, data: dict) -> dict:
    """PUT to Discourse API."""
    resp = requests.put(
        f"{DISCOURSE_URL}{path}",
        headers=DISCOURSE_HEADERS,
        json=data,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def discourse_post(path: str, data: dict) -> dict:
    """POST to Discourse API."""
    resp = requests.post(
        f"{DISCOURSE_URL}{path}",
        headers=DISCOURSE_HEADERS,
        json=data,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Claude extraction
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """\
You are analyzing a Discourse community post to extract project mentions.
The community is a small, private group of retired entrepreneurs and coders
who build things with AI (primarily Claude).

A "project" is something the POST AUTHOR is building, has built, or is
experimenting with. It must be their own work — not a tool they're merely
using or reviewing, and not another member's project.

Classify each project into one of three tiers:
- products_and_tools: Shipped, named, has users or a URL. Signals: "launched",
  "shipped", "users are using", "available at".
- active_experiments: Actively being built or prototyped. Signals: "building",
  "working on", "prototype", "automating".
- explorations: Early-stage ideas, one-off tries. Signals: "playing with",
  "thinking about", "tried", "noodling on".

If the post includes a URL for the project (website, GitHub repo, App Store
link, etc.), include it in the "url" field. Only include URLs that belong to
the project itself — not links to articles, documentation, or other people's
projects. Prefer the primary/canonical URL (product website > GitHub > App Store).

Return a JSON object with this exact structure:
{
  "projects": [
    {
      "name": "ProjectName",
      "description": "One-sentence description of what it does",
      "tier": "products_and_tools|active_experiments|explorations",
      "confidence": 0.0-1.0,
      "url": "https://example.com or null if no URL found"
    }
  ]
}

If there are no project mentions, return: {"projects": []}

Only include projects with confidence >= 0.7. Be conservative — a casual
mention of "I tried X" with no detail is low confidence.
"""

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def extract_projects(post_content: str, member_username: str) -> list[dict]:
    """Extract project mentions from a post using Claude."""
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Post by @{member_username}:\n\n{post_content}\n\n"
                    "Extract any project mentions from this post."
                ),
            }
        ],
        system=EXTRACTION_PROMPT,
    )

    text = message.content[0].text
    # Extract JSON from the response (handle markdown code blocks)
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1)

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        log.warning("Failed to parse Claude response as JSON: %s", text[:200])
        return []

    projects = result.get("projects", [])
    # Filter by confidence threshold and attach member
    return [
        {**p, "member": member_username}
        for p in projects
        if p.get("confidence", 0) >= CONFIDENCE_THRESHOLD
    ]


# ---------------------------------------------------------------------------
# Wiki post parsing and updating
# ---------------------------------------------------------------------------

TIER_HEADERS = {
    "products_and_tools": "## Products & Tools",
    "active_experiments": "## Active Experiments",
    "explorations": "## Explorations",
}

TABLE_ROW_RE = re.compile(
    r"^\|\s*(?P<project>[^|]+?)\s*\|\s*(?P<member>[^|]+?)\s*\|\s*"
    r"(?P<description>[^|]+?)\s*\|\s*(?P<links>[^|]*?)\s*\|$"
)


def parse_wiki_tables(content: str) -> dict[str, list[dict]]:
    """Parse the wiki post markdown into structured data per tier."""
    tiers: dict[str, list[dict]] = {
        "products_and_tools": [],
        "active_experiments": [],
        "explorations": [],
    }

    current_tier = None
    for line in content.split("\n"):
        stripped = line.strip()

        # Detect tier headers
        if stripped == "## Products & Tools":
            current_tier = "products_and_tools"
            continue
        elif stripped == "## Active Experiments":
            current_tier = "active_experiments"
            continue
        elif stripped == "## Explorations":
            current_tier = "explorations"
            continue
        elif stripped.startswith("## ") or stripped.startswith("# "):
            current_tier = None
            continue

        if current_tier is None:
            continue

        # Parse table rows (skip header and separator)
        match = TABLE_ROW_RE.match(stripped)
        if match and match.group("project").strip() not in ("Project", "[Project]"):
            proj_cell = match.group("project").strip()
            proj_name, proj_url = parse_project_cell(proj_cell)
            tiers[current_tier].append({
                "project": proj_name,
                "url": proj_url,
                "member": match.group("member").strip(),
                "description": match.group("description").strip(),
                "links": match.group("links").strip(),
            })

    return tiers


PROJECT_LINK_RE = re.compile(r"^\[([^\]]+)\]\(([^)]+)\)$")


def parse_project_cell(cell: str) -> tuple[str, str]:
    """Parse a project cell, returning (name, url). URL is empty if plain text."""
    match = PROJECT_LINK_RE.match(cell.strip())
    if match:
        return match.group(1), match.group(2)
    return cell.strip(), ""


def render_project_cell(name: str, url: str) -> str:
    """Render a project name, optionally as a markdown link."""
    if url:
        return f"[{name}]({url})"
    return name


def normalize_name(name: str) -> str:
    """Normalize a project name for dedup comparison."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def merge_projects(
    existing: dict[str, list[dict]],
    new_projects: list[dict],
    post_url: str,
) -> tuple[dict[str, list[dict]], list[dict]]:
    """Merge new projects into existing tiers. Returns (merged, added)."""
    added = []

    for proj in new_projects:
        tier = proj["tier"]
        name_norm = normalize_name(proj["name"])
        member = f"@{proj['member']}" if not proj["member"].startswith("@") else proj["member"]

        proj_url = proj.get("url") or ""
        if proj_url == "null":
            proj_url = ""

        # Check for existing entry (same project + member)
        found = False
        for entry in existing.get(tier, []):
            entry_member = entry["member"].lstrip("@")
            proj_member = proj["member"].lstrip("@")
            if normalize_name(entry["project"]) == name_norm and entry_member == proj_member:
                # Update description if new one is longer (more detailed)
                if len(proj["description"]) > len(entry["description"]):
                    entry["description"] = proj["description"]
                # Add project URL if we don't have one yet
                if proj_url and not entry.get("url"):
                    entry["url"] = proj_url
                # Append link if not already present
                if post_url and post_url not in entry["links"]:
                    if entry["links"]:
                        entry["links"] += f", [Post]({post_url})"
                    else:
                        entry["links"] = f"[Post]({post_url})"
                found = True
                break

        # Also check other tiers (project might have been promoted)
        if not found:
            for other_tier, entries in existing.items():
                if other_tier == tier:
                    continue
                for entry in entries:
                    entry_member = entry["member"].lstrip("@")
                    proj_member = proj["member"].lstrip("@")
                    if normalize_name(entry["project"]) == name_norm and entry_member == proj_member:
                        found = True
                        # Don't change tier — that's a member decision
                        if proj_url and not entry.get("url"):
                            entry["url"] = proj_url
                        if post_url and post_url not in entry["links"]:
                            if entry["links"]:
                                entry["links"] += f", [Post]({post_url})"
                            else:
                                entry["links"] = f"[Post]({post_url})"
                        break
                if found:
                    break

        if not found:
            existing.setdefault(tier, []).append({
                "project": proj["name"],
                "url": proj_url,
                "member": member,
                "description": proj["description"],
                "links": f"[Post]({post_url})" if post_url else "",
            })
            added.append(proj)

    return existing, added


def render_wiki_post(tiers: dict[str, list[dict]]) -> str:
    """Render structured tier data back into wiki post markdown."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    sections = []
    sections.append("# Community Project Directory\n")
    sections.append(
        "A living list of what AIC members are building. This post is a wiki — "
        "edit it directly to add or update your projects. The list is also "
        "updated automatically when you mention projects in your posts.\n"
    )

    tier_config = [
        ("products_and_tools", "Products & Tools", "Projects that are shipped, named, and available for use."),
        ("active_experiments", "Active Experiments", "Things actively being built or prototyped."),
        ("explorations", "Explorations", "Early-stage ideas and one-off experiments."),
    ]

    for tier_key, tier_title, tier_desc in tier_config:
        sections.append(f"## {tier_title}")
        sections.append(f"{tier_desc}\n")
        sections.append("| Project | Member | Description | Links |")
        sections.append("|---------|--------|-------------|-------|")
        for entry in tiers.get(tier_key, []):
            proj_cell = render_project_cell(entry["project"], entry.get("url", ""))
            sections.append(
                f"| {proj_cell} | {entry['member']} | "
                f"{entry['description']} | {entry['links']} |"
            )
        sections.append("")

    sections.append("---")
    sections.append(f"*Last automated update: {now}*")

    return "\n".join(sections)


def update_wiki_post(new_projects: list[dict], post_url: str) -> list[dict]:
    """Read the wiki post, merge new projects, write it back. Returns added projects."""
    if not WIKI_POST_ID:
        log.error("WIKI_POST_ID not set — cannot update wiki post")
        return []

    # Fetch current wiki content
    post_data = discourse_get(f"/posts/{WIKI_POST_ID}.json")
    current_content = post_data.get("raw", "")

    # Parse, merge, render
    existing = parse_wiki_tables(current_content)
    merged, added = merge_projects(existing, new_projects, post_url)

    if not added:
        log.info("No new projects to add")
        return []

    new_content = render_wiki_post(merged)

    # Update the wiki post
    discourse_put(f"/posts/{WIKI_POST_ID}.json", {
        "post": {"raw": new_content},
    })
    log.info("Updated wiki post with %d new project(s)", len(added))

    return added


def post_update_reply(added: list[dict], post_url: str) -> None:
    """Post a reply to the wiki topic summarizing what was added."""
    if not WIKI_TOPIC_ID or not added:
        return

    lines = []
    for proj in added:
        tier_label = {
            "products_and_tools": "Products & Tools",
            "active_experiments": "Active Experiments",
            "explorations": "Explorations",
        }.get(proj["tier"], proj["tier"])
        lines.append(
            f"- Added **{proj['name']}** by @{proj['member']} "
            f"to {tier_label} ([source]({post_url}))"
        )

    reply_text = "**Auto-update:**\n" + "\n".join(lines)

    discourse_post("/posts.json", {
        "topic_id": WIKI_TOPIC_ID,
        "raw": reply_text,
    })
    log.info("Posted update reply to topic %d", WIKI_TOPIC_ID)


# ---------------------------------------------------------------------------
# Webhook handler
# ---------------------------------------------------------------------------


def verify_webhook(body: bytes, signature: str) -> bool:
    """Verify Discourse webhook signature."""
    if not DISCOURSE_WEBHOOK_SECRET:
        return True  # No secret configured, skip verification
    expected = hmac.new(
        DISCOURSE_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


class WebhookHandler(BaseHTTPRequestHandler):
    """HTTP handler for Discourse webhook events."""

    def do_POST(self):
        if self.path != "/webhook":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Verify webhook signature
        signature = self.headers.get("X-Discourse-Event-Signature", "")
        if not verify_webhook(body, signature):
            log.warning("Invalid webhook signature")
            self.send_response(403)
            self.end_headers()
            return

        # Respond immediately so Discourse doesn't retry
        self.send_response(200)
        self.end_headers()

        # Process the webhook
        event_type = self.headers.get("X-Discourse-Event", "")
        if event_type not in ("post_created", "post_edited"):
            log.debug("Ignoring event type: %s", event_type)
            return

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            log.warning("Invalid JSON in webhook body")
            return

        post = payload.get("post", {})
        process_post(post)

    def log_message(self, format, *args):
        """Suppress default request logging — we use our own logger."""
        pass


def process_post(post: dict) -> None:
    """Process a single Discourse post for project mentions."""
    post_id = post.get("id")
    topic_id = post.get("topic_id")
    username = post.get("username", "")
    raw = post.get("raw", "") or post.get("cooked", "")

    # Skip: system posts, our own updates, posts in the wiki topic itself
    if username in ("system", DISCOURSE_API_USERNAME):
        log.debug("Skipping post by %s", username)
        return
    if topic_id == WIKI_TOPIC_ID:
        log.debug("Skipping post in wiki topic")
        return
    if not raw or len(raw) < 20:
        log.debug("Skipping short/empty post %s", post_id)
        return

    log.info("Processing post %s by @%s in topic %s", post_id, username, topic_id)

    # Extract projects
    projects = extract_projects(raw, username)
    if not projects:
        log.info("No project mentions found in post %s", post_id)
        return

    log.info("Found %d project mention(s) in post %s: %s",
             len(projects), post_id,
             ", ".join(p["name"] for p in projects))

    # Build post URL
    post_url = f"{DISCOURSE_URL}/t/{topic_id}/{post.get('post_number', '')}"

    # Update wiki and post reply
    added = update_wiki_post(projects, post_url)
    post_update_reply(added, post_url)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not WIKI_POST_ID or not WIKI_TOPIC_ID:
        log.error(
            "WIKI_POST_ID and WIKI_TOPIC_ID must be set. "
            "Create the pinned wiki topic first, then set these."
        )
        sys.exit(1)

    server = HTTPServer(("127.0.0.1", LISTEN_PORT), WebhookHandler)
    log.info("Project tracker listening on port %d", LISTEN_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Shutting down")
        server.server_close()


if __name__ == "__main__":
    main()
