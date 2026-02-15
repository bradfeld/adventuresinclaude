---
name: blog-publish
description: Use when ready to publish a post to adventuresinclaude.ai
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git:*)
  - Bash(hugo:*)
  - Bash(wc:*)
  - Bash(ls:*)
  - Glob
  - Grep
  - AskUserQuestion
---

# /blog-publish - Publish to Adventures in Claude

Commit, push, and deploy a blog post to adventuresinclaude.ai.

## Usage

```
/blog-publish                    # Publish latest draft
/blog-publish specific-post      # Publish specific post by slug
```

## Workflow

### Step 1: Find the Post

If argument provided, look for a matching file in `~/Code/adventuresinclaude/content/posts/`.

If no argument, find the most recently modified `.md` file in `content/posts/`:

```bash
ls -t ~/Code/adventuresinclaude/content/posts/*.md | head -5
```

Show the list and ask which post to publish if multiple candidates.

### Step 2: Check Draft Status

Read the post's front matter. If `draft: true`:

Ask: "This post is marked as draft. Flip to published?"
- If yes: change `draft: true` to `draft: false`
- If no: stop

### Step 3: Voice Check

Before publishing, scan for common voice violations:

- Em dashes (---) should be hyphens with spaces ( - )
- AI slop words: delve, nuanced, landscape, navigate, robust, seamlessly, comprehensive, foster, pivotal, transformative
- Hedging: perhaps, arguably, it could be said

If violations found, show them and offer to fix. If clean, proceed.

### Step 4: Show Post Summary

Display:

```
## Ready to Publish

**Title:** [from front matter]
**Date:** [from front matter]
**Tags:** [from front matter]
**Words:** [word count of body]
**Preview:** [first 200 characters of body]

Publish to adventuresinclaude.ai? Reply "publish" or suggest changes.
```

Wait for user confirmation.

### Step 5: Commit and Push

```bash
cd ~/Code/adventuresinclaude
git add content/posts/
git commit -m "post: [title from front matter]

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

### Step 6: Report

```
## Published to Adventures in Claude

**Title:** [title]
**URL:** https://adventuresinclaude.ai/posts/[slug]/
**RSS:** https://adventuresinclaude.ai/index.xml

Vercel deploying now (~30 seconds). Kit will auto-send email to subscribers when RSS updates.
```

### Step 7: Social (Phase 2 - Not Yet Implemented)

When social APIs are configured, this step will:
1. Draft blurbs for X and LinkedIn
2. Show for approval
3. Post to both platforms

For now, skip this step and note it's not yet available.

## Voice

Apply Brad's voice profile from `~/.claude/voice/voice-profile.md` when editing content.
