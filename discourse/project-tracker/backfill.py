#!/usr/bin/env python3
"""
AIC Project Tracker — Backfill script.

One-time script to scan all existing Discourse posts and extract project
mentions. Outputs a draft wiki post for human review before publishing.

Usage:
    # Preview mode (default) — outputs draft to stdout
    python backfill.py

    # Write mode — creates the pinned wiki topic directly
    python backfill.py --create-topic

    # Save draft to file for review
    python backfill.py > draft.md
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from collections import defaultdict

import anthropic
import requests

# Reuse config from tracker
DISCOURSE_URL = os.environ.get("DISCOURSE_URL", "https://community.adventuresinclaude.ai")
DISCOURSE_API_KEY = os.environ["DISCOURSE_API_KEY"]
DISCOURSE_API_USERNAME = os.environ.get("DISCOURSE_API_USERNAME", "bfeld")
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
CONFIDENCE_THRESHOLD = 0.7
PROJECTS_CATEGORY_ID = 6  # Projects category

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],  # Logs to stderr so stdout is clean for draft
)
log = logging.getLogger("backfill")

DISCOURSE_HEADERS = {
    "Api-Key": DISCOURSE_API_KEY,
    "Api-Username": DISCOURSE_API_USERNAME,
    "Content-Type": "application/json",
}

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def sanitize_field(s: str) -> str:
    """Strip pipe characters from text fields to prevent Discourse markdown table corruption."""
    return s.replace("|", "-").strip()


# ---------------------------------------------------------------------------
# Discourse API — fetch all posts
# ---------------------------------------------------------------------------


def fetch_all_topics() -> list[dict]:
    """Fetch all topics across all categories."""
    topics = []
    # Fetch from each category's topic list
    for category_id in [5, 6, 7, 8]:  # Introductions, Projects, Tips, Discussion
        page = 0
        while True:
            url = f"{DISCOURSE_URL}/c/{category_id}.json?page={page}"
            resp = requests.get(url, headers=DISCOURSE_HEADERS, timeout=30)
            if resp.status_code != 200:
                break
            data = resp.json()
            topic_list = data.get("topic_list", {}).get("topics", [])
            if not topic_list:
                break
            topics.extend(topic_list)
            page += 1
            time.sleep(0.5)  # Rate limit courtesy

    log.info("Fetched %d topics across all categories", len(topics))
    return topics


def fetch_topic_posts(topic_id: int) -> list[dict]:
    """Fetch all posts in a topic."""
    posts = []
    url = f"{DISCOURSE_URL}/t/{topic_id}.json"
    resp = requests.get(url, headers=DISCOURSE_HEADERS, timeout=30)
    if resp.status_code != 200:
        log.warning("Failed to fetch topic %d: %d", topic_id, resp.status_code)
        return []

    data = resp.json()
    post_stream = data.get("post_stream", {})
    posts_data = post_stream.get("posts", [])

    for post in posts_data:
        # Topic endpoint returns cooked (HTML) but not raw; use cooked
        content = post.get("raw", "") or post.get("cooked", "")
        posts.append({
            "id": post["id"],
            "username": post.get("username", ""),
            "content": content,
            "topic_id": topic_id,
            "topic_title": data.get("title", ""),
            "post_number": post.get("post_number", 1),
            "created_at": post.get("created_at", ""),
        })

    # If there are more posts not included in the initial response
    stream_ids = post_stream.get("stream", [])
    loaded_ids = {p["id"] for p in posts_data}
    missing_ids = [pid for pid in stream_ids if pid not in loaded_ids]

    if missing_ids:
        # Fetch in chunks of 20
        for i in range(0, len(missing_ids), 20):
            chunk = missing_ids[i:i + 20]
            params = "&".join(f"post_ids[]={pid}" for pid in chunk)
            extra_url = f"{DISCOURSE_URL}/t/{topic_id}/posts.json?{params}"
            extra_resp = requests.get(extra_url, headers=DISCOURSE_HEADERS, timeout=30)
            if extra_resp.status_code == 200:
                extra_posts = extra_resp.json().get("post_stream", {}).get("posts", [])
                for post in extra_posts:
                    content = post.get("raw", "") or post.get("cooked", "")
                    posts.append({
                        "id": post["id"],
                        "username": post.get("username", ""),
                        "content": content,
                        "topic_id": topic_id,
                        "topic_title": data.get("title", ""),
                        "post_number": post.get("post_number", 1),
                        "created_at": post.get("created_at", ""),
                    })
            time.sleep(0.3)

    return posts


# ---------------------------------------------------------------------------
# Claude extraction (batch by member)
# ---------------------------------------------------------------------------

BATCH_EXTRACTION_PROMPT = """\
You are analyzing multiple Discourse community posts by the same member
to extract project mentions. The community is a small, private group of
retired entrepreneurs and coders who build things with AI (primarily Claude).

A "project" is something the member is building, has built, or is
experimenting with. It must be their own work — not a tool they're merely
using or reviewing, and not another member's project.

When the same project is mentioned across multiple posts, combine them
into a single entry with the best description. Use the most detailed
description available.

Classify each project into one of three tiers:
- products_and_tools: Shipped, named, has users or a URL.
- active_experiments: Actively being built or prototyped.
- explorations: Early-stage ideas, one-off tries.

If the posts include a URL for the project (website, GitHub repo, App Store
link, etc.), include it in the "url" field. Only include URLs that belong to
the project itself — not links to articles, documentation, or other people's
projects. Prefer the primary/canonical URL (product website > GitHub > App Store).

Return a JSON object:
{
  "projects": [
    {
      "name": "ProjectName",
      "description": "One-sentence description",
      "tier": "products_and_tools|active_experiments|explorations",
      "confidence": 0.0-1.0,
      "url": "https://example.com or null if no URL found",
      "source_posts": [1, 3]
    }
  ]
}

If no projects found, return: {"projects": []}
Only include projects with confidence >= 0.7.
"""


def extract_projects_batch(member: str, posts: list[dict]) -> list[dict]:
    """Extract projects from all posts by a single member."""
    # Build context with numbered posts
    post_texts = []
    for i, post in enumerate(posts):
        topic_info = f" (topic: {post['topic_title']})" if post.get("topic_title") else ""
        post_texts.append(f"--- Post {i}{topic_info} ---\n{post['content'][:2000]}")

    combined = "\n\n".join(post_texts)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": (
                    f"All posts by @{member} ({len(posts)} total):\n\n"
                    f"{combined}\n\n"
                    "Extract all project mentions from these posts."
                ),
            }
        ],
        system=BATCH_EXTRACTION_PROMPT,
    )

    text = message.content[0].text
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1)

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        log.warning("Failed to parse Claude response for @%s: %s", member, text[:200])
        return []

    projects = result.get("projects", [])
    extracted = []
    for p in projects:
        if p.get("confidence", 0) < CONFIDENCE_THRESHOLD:
            continue

        # Resolve source post links
        source_indices = p.get("source_posts", [0])
        links = []
        for idx in source_indices:
            if 0 <= idx < len(posts):
                post = posts[idx]
                url = f"{DISCOURSE_URL}/t/{post['topic_id']}/{post['post_number']}"
                links.append(f"[Post]({url})")

        proj_url = p.get("url") or ""
        if proj_url == "null":
            proj_url = ""

        extracted.append({
            "name": sanitize_field(p["name"]),
            "url": proj_url,
            "member": f"@{member}",
            "description": sanitize_field(p["description"]),
            "tier": p["tier"],
            "confidence": p.get("confidence", 0.7),
            "links": ", ".join(links) if links else "",
        })

    return extracted


# ---------------------------------------------------------------------------
# Wiki post rendering
# ---------------------------------------------------------------------------


def render_wiki_post(all_projects: list[dict]) -> str:
    """Render the full wiki post from all extracted projects."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    tiers = {
        "products_and_tools": [],
        "active_experiments": [],
        "explorations": [],
    }

    for proj in all_projects:
        tiers.setdefault(proj["tier"], []).append(proj)

    # Sort each tier by project name
    for tier in tiers.values():
        tier.sort(key=lambda p: p["name"].lower())

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
            proj_url = entry.get("url", "")
            proj_cell = f"[{entry['name']}]({proj_url})" if proj_url else entry["name"]
            sections.append(
                f"| {proj_cell} | {entry['member']} | "
                f"{entry['description']} | {entry['links']} |"
            )
        sections.append("")

    sections.append("---")
    sections.append(f"*Last automated update: {now}*")

    return "\n".join(sections)


# ---------------------------------------------------------------------------
# Topic creation
# ---------------------------------------------------------------------------


def create_wiki_topic(content: str) -> dict:
    """Create the pinned wiki topic in the Projects category."""
    # Create the topic
    result = requests.post(
        f"{DISCOURSE_URL}/posts.json",
        headers=DISCOURSE_HEADERS,
        json={
            "title": "Community Project Directory",
            "raw": content,
            "category": PROJECTS_CATEGORY_ID,
        },
        timeout=30,
    )
    result.raise_for_status()
    post_data = result.json()

    topic_id = post_data["topic_id"]
    post_id = post_data["id"]

    # Make it a wiki post
    requests.put(
        f"{DISCOURSE_URL}/posts/{post_id}/wiki",
        headers=DISCOURSE_HEADERS,
        json={"wiki": True},
        timeout=30,
    ).raise_for_status()

    # Pin the topic
    requests.put(
        f"{DISCOURSE_URL}/t/{topic_id}/status",
        headers=DISCOURSE_HEADERS,
        json={"status": "pinned", "enabled": True},
        timeout=30,
    ).raise_for_status()

    log.info("Created wiki topic %d with post %d", topic_id, post_id)
    return {"topic_id": topic_id, "post_id": post_id}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Backfill AIC Project Directory")
    parser.add_argument(
        "--create-topic",
        action="store_true",
        help="Create the pinned wiki topic directly (default: preview to stdout)",
    )
    args = parser.parse_args()

    log.info("Starting backfill — fetching all topics...")
    topics = fetch_all_topics()

    # Fetch all posts from all topics
    log.info("Fetching posts from %d topics...", len(topics))
    all_posts: list[dict] = []
    for topic in topics:
        topic_id = topic["id"]
        posts = fetch_topic_posts(topic_id)
        # Filter out system posts
        posts = [p for p in posts if p["username"] not in ("system", DISCOURSE_API_USERNAME)]
        all_posts.extend(posts)
        time.sleep(0.3)

    log.info("Fetched %d posts total (excluding system)", len(all_posts))

    # Group posts by member
    by_member: dict[str, list[dict]] = defaultdict(list)
    for post in all_posts:
        by_member[post["username"]].append(post)

    log.info("Found posts from %d members", len(by_member))

    # Extract projects per member
    all_projects: list[dict] = []
    for member, posts in sorted(by_member.items()):
        log.info("Extracting projects for @%s (%d posts)...", member, len(posts))
        projects = extract_projects_batch(member, posts)
        if projects:
            log.info("  Found %d project(s): %s",
                     len(projects), ", ".join(p["name"] for p in projects))
            all_projects.extend(projects)
        time.sleep(1)  # Rate limit for Claude API

    log.info("Total: %d projects from %d members", len(all_projects), len(by_member))

    # Render the wiki post
    wiki_content = render_wiki_post(all_projects)

    if args.create_topic:
        log.info("Creating pinned wiki topic...")
        result = create_wiki_topic(wiki_content)
        print(f"\nTopic created successfully!", file=sys.stderr)
        print(f"  Topic ID: {result['topic_id']}", file=sys.stderr)
        print(f"  Post ID:  {result['post_id']}", file=sys.stderr)
        print(f"  URL: {DISCOURSE_URL}/t/{result['topic_id']}", file=sys.stderr)
        print(f"\nSet these environment variables for tracker.py:", file=sys.stderr)
        print(f"  WIKI_TOPIC_ID={result['topic_id']}", file=sys.stderr)
        print(f"  WIKI_POST_ID={result['post_id']}", file=sys.stderr)
    else:
        # Output draft to stdout for review
        print(wiki_content)
        print(f"\n--- STATS ---", file=sys.stderr)
        print(f"Products & Tools:   {sum(1 for p in all_projects if p['tier'] == 'products_and_tools')}", file=sys.stderr)
        print(f"Active Experiments: {sum(1 for p in all_projects if p['tier'] == 'active_experiments')}", file=sys.stderr)
        print(f"Explorations:       {sum(1 for p in all_projects if p['tier'] == 'explorations')}", file=sys.stderr)
        print(f"Total:              {len(all_projects)}", file=sys.stderr)
        print(f"\nReview the draft above, then run with --create-topic to publish.", file=sys.stderr)


if __name__ == "__main__":
    main()
