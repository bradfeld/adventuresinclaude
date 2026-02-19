# AIC Project Tracker Design

**Date:** 2026-02-18
**Status:** Approved

## Overview

Automated system that tracks projects mentioned by members in the AIC Discourse community (community.adventuresinclaude.ai) and maintains a pinned wiki topic as a living project directory.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where list lives | Private Discourse pinned wiki topic | Start private, expand to website later if comfortable |
| Project hierarchy | 3 tiers (Products & Tools, Active Experiments, Explorations) | Natural progression from idea to shipped product |
| Extraction method | AI-powered (Claude API) | Catches mentions regardless of phrasing, no member friction |
| Edit model | Wiki post + reply thread | Wiki for quick edits, replies for discussion |
| Scan cadence | Event-driven (Discourse webhook) | Real-time updates, small community = manageable volume |
| Output format | Markdown tables per tier | Scannable, parseable by AI for updates |
| Processing location | Python script on Discourse droplet | Co-located, no external dependencies, matches existing infra |
| Removal policy | AI never removes entries | Only members remove via wiki edit |

## Architecture

```
New Discourse Post
       |
Discourse Webhook --> POST /projects/webhook
       |
Python listener (/opt/project-tracker/tracker.py)
       |
Claude API extracts project mentions
       |
Read current wiki post via Discourse API
       |
Merge new projects into table
       |
Update wiki post via Discourse API
(+ reply: "Added ProjectX by @member")
```

## Components

### 1. Webhook Listener (`tracker.py`)

Python HTTP server listening on a dedicated port. Receives `post_created` and `post_edited` events from Discourse. Validates the webhook secret, extracts post content, and triggers the extraction pipeline.

### 2. Project Extractor

Calls Claude API (Haiku for cost efficiency) with structured prompt. Returns JSON with project mentions including name, member, description, tier, and confidence score.

**Extraction criteria:**
- Member describes something they built, are building, or experimenting with
- Has a name or identifiable concept
- Excludes: tools merely being used, product reviews, other members' projects

**Tier classification:**

| Tier | Signals |
|------|---------|
| Products & Tools | "launched", "shipped", "users are...", has URL, named product |
| Active Experiments | "building", "working on", "prototype", active development |
| Explorations | "playing with", "thinking about", "tried", one-off mention |

**Confidence threshold:** >= 0.7 to add. Below that, skip.

### 3. Wiki Updater

Reads current pinned post via Discourse API, parses markdown tables into data structures, merges new entries (add new, update descriptions if richer, never remove), writes back, posts summary reply.

**Deduplication:** Fuzzy match on project name + member combo. Same project mentioned in multiple posts = one entry with best description and multiple links.

### 4. Backfill Script (`backfill.py`)

One-time script to bootstrap the initial list:
1. Fetch all posts via Discourse API (paginated)
2. Group by member for better Claude context
3. Extract project mentions in batches
4. Output draft for human review
5. Create pinned wiki topic with reviewed content

## Wiki Post Format

```markdown
# Community Project Directory

A living list of what AIC members are building. This post is a wiki —
edit it directly to add or update your projects. The list is also
updated automatically when you mention projects in your posts.

## Products & Tools
Projects that are shipped, named, and available for use.

| Project | Member | Description | Links |
|---------|--------|-------------|-------|
| Example | @member | Description here | [Post](link) |

## Active Experiments
Things actively being built or prototyped.

| Project | Member | Description | Links |
|---------|--------|-------------|-------|

## Explorations
Early-stage ideas and one-off experiments.

| Project | Member | Description | Links |
|---------|--------|-------------|-------|

---
*Last automated update: YYYY-MM-DD HH:MM UTC*
```

## Community Launch

After backfill and review, post a broadcast in Discussion category (ID: 8):

**Subject:** New: Community Project Directory

**Body:** Explains the automated directory, links to the pinned topic, describes the 3 tiers, explains wiki editing, and invites feedback.

## Infrastructure

- **Runs on:** Discourse droplet (24.144.80.161)
- **Location:** `/opt/project-tracker/`
- **Process manager:** systemd service
- **Secrets:** Claude API key (GCP SM: `aic_anthropic_api_key` or fetch from existing), Discourse API key (already on droplet)
- **Logging:** systemd journal
- **Monitoring:** Log errors, could add BetterStack heartbeat later

## File Structure

```
discourse/project-tracker/
  tracker.py          # Webhook listener + extraction + wiki update
  backfill.py         # One-time backfill script
  requirements.txt    # Python dependencies
  README.md           # Deployment and setup instructions
```
