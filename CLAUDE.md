# Adventures in Claude

Hugo static blog at adventuresinclaude.ai.

## Repo Structure

- `content/posts/` - Blog posts (markdown with YAML front matter)
- `content/about.md` - About page
- `content/search.md` - Search page (PaperMod Fuse.js)
- `hugo.toml` - Site configuration
- `themes/PaperMod/` - Theme (git submodule, don't edit directly)
- `static/images/` - Post images

## Commands

- `/blogaic-post` - Publish a post (voice check, commit, push, deploy, LinkedIn, X)
- `/blogaic-draft` - Aggregate daily notes into a blog post draft
- `/linkedin-setup` - Configure or refresh LinkedIn API credentials (60-day token)
- `/x-setup` - Configure X (Twitter) API credentials for auto-posting

## Post Format

```markdown
---
title: "Post Title"
date: YYYY-MM-DD
tags: ["tag1", "tag2"]
description: "One-line summary for RSS and social"
draft: false
---

Content in markdown...
```

## Content Pipeline

1. `/note` captures insights throughout the day (global command)
2. `/blogaic-draft` aggregates notes into a post draft
3. Edit the draft in `content/posts/`
4. `/blogaic-post` commits, pushes, deploys, and posts to LinkedIn + X

## Deployment

- Push to `main` triggers Vercel auto-deploy
- Domains: adventuresinclaude.ai (primary), adventuresinclaude.com
- Kit (ConvertKit) watches RSS feed and emails subscribers

## Local Development

```bash
hugo server -D --port 4000    # Dev server with drafts, port 4000
hugo --minify                  # Production build
```

## Workflow Profile

```yaml
workflow:
  base_branch: main
  direct_to_main: true
  investigation: light
  plan_approval: auto
  user_testing: skip
  quality_gates: []
  review:
    triage: false
    max_level: NONE
  ship:
    method: direct_push
    target: main
    linear_status: "Done"
    deploy_hint: "Push to main triggers Vercel auto-deploy"
  labels:
    auto_detect: false
```

## LinkedIn Integration

- **API**: LinkedIn REST Posts API (`/rest/posts`) with `Linkedin-Version: 202501`
- **Post type**: Article (link preview card with title, description)
- **Credentials**: `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` in `.env.local`
- **Token expiry**: 60 days — run `/linkedin-setup` to refresh
- **Non-blocking**: LinkedIn failures never block blog publishing

## X (Twitter) Integration

- **API**: X API v2 (`POST https://api.x.com/2/tweets`) with OAuth 1.0a signing
- **Post format**: Title + link + hashtags (within 280 char limit)
- **Credentials**: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` in `.env.local`
- **Auth note**: Free tier requires OAuth 1.0a (OAuth 2.0 requires Basic tier at $100/month)
- **Rate limit**: ~500 posts/month on free tier
- **Non-blocking**: X failures never block blog publishing

## Voice

Apply Brad's voice profile from `~/.claude/voice/voice-profile.md` when writing or editing posts.
