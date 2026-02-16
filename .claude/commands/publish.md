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
  - Bash(curl:*)
  - Bash(jq:*)
  - Bash(printf:*)
  - Bash(cat:*)
  - Bash(grep:*)
  - Bash(rm:*)
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
**LinkedIn:** [Posted - URL | Skipped - reason | Failed - reason]

Vercel deploying now (~30 seconds). Kit will auto-send email to subscribers when RSS updates.
```

### Step 7: LinkedIn Post

Post to LinkedIn with the blog post title, excerpt, and link. **Non-blocking**: if anything fails, print a message and continue — never block the publish.

#### Step 7.1: Check Credentials

Read `.env.local` from `~/Code/adventuresinclaude/`:

```bash
# Source credentials
LINKEDIN_ACCESS_TOKEN=$(grep '^LINKEDIN_ACCESS_TOKEN=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
LINKEDIN_PERSON_URN=$(grep '^LINKEDIN_PERSON_URN=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
```

**If either is missing or empty:**

```
LinkedIn: Skipped — credentials not configured.
Run /linkedin-setup to connect your LinkedIn account.
```

Skip to Step 6 report. Do not block the publish.

#### Step 7.2: Draft the Post

Extract from the post's front matter:
- **title** - Post title
- **description** - One-line summary (if empty, use first 200 characters of body)
- **slug** - Filename without `.md` extension
- **tags** - For hashtags

Construct the post URL: `https://adventuresinclaude.ai/posts/[slug]/`

Draft the LinkedIn commentary text:

```
[title]

[description or first 200 chars of body]

[post URL]

#AdventuresInClaude [#tag1 #tag2 from front matter tags, max 3 hashtags]
```

#### Step 7.3: Show Draft and Get Approval

Display the draft to the user:

```
## LinkedIn Draft

[commentary text from above]

Post format: Article (shows link preview card with title and description)
```

Use AskUserQuestion:

```typescript
AskUserQuestion({
  questions: [{
    question: "Post this to LinkedIn?",
    header: "LinkedIn",
    options: [
      { label: "Post it", description: "Publish to LinkedIn now" },
      { label: "Edit first", description: "Modify the text before posting" },
      { label: "Skip", description: "Don't post to LinkedIn" }
    ],
    multiSelect: false
  }]
});
```

- **"Post it"** → Continue to Step 7.4
- **"Edit first"** → Ask for changes, update draft, show again
- **"Skip"** → Set LinkedIn result to "Skipped — user declined", proceed to report

#### Step 7.4: Post to LinkedIn

Build JSON payload in a temp file to avoid shell escaping issues:

```bash
cat > /tmp/linkedin-post.json << 'JSONEOF'
{
  "author": "urn:li:person:PERSON_URN_VALUE",
  "commentary": "COMMENTARY_TEXT",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "article": {
      "source": "POST_URL",
      "title": "POST_TITLE",
      "description": "POST_DESCRIPTION"
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
JSONEOF
```

**Important:** Do NOT use heredoc directly for the JSON — instead, build the JSON using `jq` or `printf` to safely interpolate values:

```bash
jq -n \
  --arg author "$LINKEDIN_PERSON_URN" \
  --arg commentary "$COMMENTARY" \
  --arg source "$POST_URL" \
  --arg title "$TITLE" \
  --arg description "$DESCRIPTION" \
  '{
    author: ("urn:li:person:" + $author),
    commentary: $commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    content: {
      article: {
        source: $source,
        title: $title,
        description: $description
      }
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  }' > /tmp/linkedin-post.json
```

Send the request:

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 15 \
  -X POST "https://api.linkedin.com/rest/posts" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -H "LinkedIn-Version: 202501" \
  -d @/tmp/linkedin-post.json)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
```

Clean up temp file:

```bash
rm -f /tmp/linkedin-post.json
```

#### Step 7.5: Handle Response

**Success (201 Created):**

The `x-restli-id` response header contains the post URN. Extract it:

```bash
# The post URN is in the x-restli-id header; capture it with -i flag or use -D
POST_URN=$(curl -s -D - --max-time 15 \
  -X POST "https://api.linkedin.com/rest/posts" \
  ... | grep -i 'x-restli-id' | tr -d '\r' | cut -d' ' -f2)
```

Set LinkedIn result: `Posted - https://www.linkedin.com/feed/update/$POST_URN/`

**Error handling by status code:**

| HTTP Code | Message | Action |
|-----------|---------|--------|
| 201 | Success | Extract post URN, build LinkedIn URL |
| 401 | "Token expired" | Print: "Run `/linkedin-setup` to re-authorize" |
| 403 | "Insufficient permissions" | Print: "Check LinkedIn app permissions (needs w_member_social)" |
| 429 | "Rate limited" | Print: "LinkedIn rate limit hit, try posting manually later" |
| 5xx | "LinkedIn API unavailable" | Print: "LinkedIn is down, try again later" |
| Timeout | "Request timed out" | Print: "LinkedIn request timed out after 15s" |
| Other | "Unexpected error" | Print: "LinkedIn returned HTTP [code]: [body snippet]" |

**All error paths:** Set LinkedIn result to `Failed — [message]`, then **proceed to Step 6 report**. Never block the publish.

#### Step 7.6: Social — Future Platforms

X (Twitter) posting is not yet implemented. When X API access is configured, add a similar workflow here with a separate credential check and draft approval.

## Voice

Apply Brad's voice profile from `~/.claude/voice/voice-profile.md` when editing content.
