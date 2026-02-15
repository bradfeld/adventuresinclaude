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

- `/blog-publish` - Publish a post (voice check, commit, push, deploy)

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
2. `/blog-draft` aggregates notes into a post draft (global command)
3. Edit the draft in `content/posts/`
4. `/blog-publish` commits, pushes, and reports deployment

## Deployment

- Push to `main` triggers Vercel auto-deploy
- Domains: adventuresinclaude.ai (primary), adventuresinclaude.com
- Kit (ConvertKit) watches RSS feed and emails subscribers

## Local Development

```bash
hugo server -D --port 4000    # Dev server with drafts, port 4000
hugo --minify                  # Production build
```

## Voice

Apply Brad's voice profile from `~/.claude/voice/voice-profile.md` when writing or editing posts.
