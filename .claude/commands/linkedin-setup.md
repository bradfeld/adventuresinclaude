---
name: linkedin-setup
description: Use when setting up or refreshing LinkedIn API credentials for blog publishing
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(curl:*)
  - Bash(jq:*)
  - Bash(grep:*)
  - Bash(cat:*)
  - Bash(printf:*)
  - AskUserQuestion
---

# /linkedin-setup - Configure LinkedIn API Access

One-time setup (refresh every 60 days) for LinkedIn auto-posting from `/blog-publish`.

## Usage

```
/linkedin-setup              # Set up or refresh LinkedIn credentials
```

## Workflow

### Step 1: Check Existing Credentials

Read `~/Code/adventuresinclaude/.env.local` and check for existing credentials:

```bash
LINKEDIN_ACCESS_TOKEN=$(grep '^LINKEDIN_ACCESS_TOKEN=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
LINKEDIN_PERSON_URN=$(grep '^LINKEDIN_PERSON_URN=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
```

**If both exist**, test the token:

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 \
  "https://api.linkedin.com/v2/userinfo" \
  -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
```

**If token is valid (200):**

```
LinkedIn credentials found and valid!

  Person URN: [LINKEDIN_PERSON_URN]
  Token status: Active

Credentials are working. No changes needed.
```

Use AskUserQuestion to confirm:

```typescript
AskUserQuestion({
  questions: [{
    question: "Token is valid. What would you like to do?",
    header: "LinkedIn",
    options: [
      { label: "Keep current", description: "Exit — credentials are working" },
      { label: "Refresh token", description: "Replace with a new token" }
    ],
    multiSelect: false
  }]
});
```

- **"Keep current"** → Exit
- **"Refresh token"** → Continue to Step 2

**If token is invalid (401) or missing:**

```
LinkedIn credentials need to be configured.
```

Continue to Step 2.

### Step 2: Get Access Token

Display instructions:

```
## LinkedIn Token Setup

1. Go to: https://www.linkedin.com/developers/apps
2. Select your app (or create one — needs "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" products)
3. Go to the "Auth" tab
4. Under "OAuth 2.0 tools", click "Generate token"
5. Select scopes: openid, profile, w_member_social
6. Complete the authorization flow
7. Copy the generated access token
```

Use AskUserQuestion:

```typescript
AskUserQuestion({
  questions: [{
    question: "Paste your LinkedIn access token:",
    header: "Token",
    options: [
      { label: "I have the token", description: "Ready to paste the access token" },
      { label: "Need help", description: "Show more detailed instructions" }
    ],
    multiSelect: false
  }]
});
```

If **"Need help"**, show additional guidance about creating a LinkedIn app, adding products, and generating tokens. Then ask again.

If **"I have the token"**, ask the user to paste it (they'll type it in the "Other" free-text field or as a follow-up message).

### Step 3: Validate Token and Get Person URN

Use the token to fetch the user's profile:

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 \
  "https://api.linkedin.com/v2/userinfo" \
  -H "Authorization: Bearer $NEW_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
```

**If valid (200):**

Extract the person identifier:

```bash
PERSON_SUB=$(echo "$BODY" | jq -r '.sub')
NAME=$(echo "$BODY" | jq -r '.name')
```

Display:

```
Token validated!

  Name: [NAME]
  Person URN: [PERSON_SUB]
```

**If invalid (401/403):**

```
Token validation failed (HTTP [code]).

Common issues:
- Token may have been copied incorrectly (check for trailing spaces)
- Token may not have the required scopes (openid, profile, w_member_social)
- Token may have already expired

Try generating a new token and run /linkedin-setup again.
```

Exit.

### Step 4: Save Credentials

Read the existing `.env.local` file, update or add the LinkedIn variables:

```bash
# Read existing .env.local
ENV_FILE=~/Code/adventuresinclaude/.env.local
```

If the file exists, update existing values or append new ones:

- If `LINKEDIN_ACCESS_TOKEN=` line exists → replace it
- If not → append `LINKEDIN_ACCESS_TOKEN=[token]`
- If `LINKEDIN_PERSON_URN=` line exists → replace it
- If not → append `LINKEDIN_PERSON_URN=[person_sub]`

Use Edit tool to modify the file, or Write if creating fresh.

**Important:** Use `printf '%s'` not `echo` to avoid trailing newlines in values.

### Step 5: Verify

Read back the saved credentials and confirm:

```bash
grep 'LINKEDIN_' ~/Code/adventuresinclaude/.env.local
```

Display:

```
## LinkedIn Setup Complete

  Name: [NAME]
  Person URN: [PERSON_SUB]
  Token saved to: ~/Code/adventuresinclaude/.env.local
  Token expires: ~60 days from now

When your token expires, `/blog-publish` will show:
  "LinkedIn: Failed — Token expired. Run /linkedin-setup to re-authorize"

Just run /linkedin-setup again to refresh.
```

## Notes

- `.env.local` is gitignored (`.env*.local` pattern in `.gitignore`)
- LinkedIn access tokens expire after 60 days
- The `w_member_social` scope is required for posting
- The `openid` and `profile` scopes are required for the userinfo endpoint
- Person URN format from userinfo is a plain string (e.g., `abc123`), used as `urn:li:person:abc123` in API calls
