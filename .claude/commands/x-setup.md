---
name: x-setup
description: Use when setting up or refreshing X (Twitter) API credentials for blog publishing
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
  - Bash(openssl:*)
  - AskUserQuestion
---

# /x-setup - Configure X (Twitter) API Access

One-time setup for X auto-posting from `/blogaic-post`. Uses OAuth 1.0a (free tier).

## Usage

```
/x-setup              # Set up or refresh X credentials
```

## Workflow

### Step 1: Check Existing Credentials

Read `~/Code/adventuresinclaude/.env.local` and check for existing credentials:

```bash
X_API_KEY=$(grep '^X_API_KEY=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
X_API_SECRET=$(grep '^X_API_SECRET=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
X_ACCESS_TOKEN=$(grep '^X_ACCESS_TOKEN=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
X_ACCESS_TOKEN_SECRET=$(grep '^X_ACCESS_TOKEN_SECRET=' ~/Code/adventuresinclaude/.env.local 2>/dev/null | cut -d= -f2-)
```

**If all four exist**, test them by making a signed request to verify credentials (Step 3 validation).

**If valid (200):**

```
X credentials found and valid!

  API Key: [first 8 chars]...
  Token status: Active

Credentials are working. No changes needed.
```

Use AskUserQuestion to confirm:

```typescript
AskUserQuestion({
  questions: [{
    question: "Credentials are valid. What would you like to do?",
    header: "X Setup",
    options: [
      { label: "Keep current", description: "Exit — credentials are working" },
      { label: "Replace credentials", description: "Enter new API keys" }
    ],
    multiSelect: false
  }]
});
```

- **"Keep current"** → Exit
- **"Replace credentials"** → Continue to Step 2

**If any credential is missing or validation fails:**

```
X credentials need to be configured.
```

Continue to Step 2.

### Step 2: Get API Credentials

Display instructions:

```
## X Developer App Setup

1. Go to: https://developer.x.com/en/portal/projects-and-apps
2. Create a project and app (or select existing)
3. In app settings, go to "User authentication settings"
4. Enable OAuth 1.0a with Read and Write permissions
5. Go to "Keys and tokens" tab
6. Under "Consumer Keys": copy API Key and API Secret
7. Under "Authentication Tokens": generate Access Token and Secret
   (Make sure permissions are set to Read and Write BEFORE generating tokens)
```

Ask for each credential:

```
Paste your X API Key (Consumer Key):
```

Then:

```
Paste your X API Secret (Consumer Secret):
```

Then:

```
Paste your X Access Token:
```

Then:

```
Paste your X Access Token Secret:
```

### Step 3: Validate Credentials

Test the credentials by making a signed OAuth 1.0a request to `GET https://api.x.com/2/users/me`:

**Build the OAuth 1.0a signature:**

```bash
# Percent-encode function
percent_encode() {
  printf '%s' "$1" | curl -Gso /dev/null -w '%{url_effective}' --data-urlencode @- '' | cut -c3-
}

METHOD="GET"
URL="https://api.x.com/2/users/me"
NONCE=$(openssl rand -hex 16)
TIMESTAMP=$(date +%s)

# Build parameter string (sorted alphabetically)
PARAMS="oauth_consumer_key=$(percent_encode "$X_API_KEY")&oauth_nonce=$(percent_encode "$NONCE")&oauth_signature_method=HMAC-SHA1&oauth_timestamp=$TIMESTAMP&oauth_token=$(percent_encode "$X_ACCESS_TOKEN")&oauth_version=1.0"

# Build signature base string
BASE_STRING="$METHOD&$(percent_encode "$URL")&$(percent_encode "$PARAMS")"

# Build signing key
SIGNING_KEY="$(percent_encode "$X_API_SECRET")&$(percent_encode "$X_ACCESS_TOKEN_SECRET")"

# Compute HMAC-SHA1 signature
SIGNATURE=$(printf '%s' "$BASE_STRING" | openssl dgst -sha1 -binary -hmac "$SIGNING_KEY" | base64)

# Build Authorization header
AUTH_HEADER="OAuth oauth_consumer_key=\"$(percent_encode "$X_API_KEY")\", oauth_nonce=\"$(percent_encode "$NONCE")\", oauth_signature=\"$(percent_encode "$SIGNATURE")\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"$TIMESTAMP\", oauth_token=\"$(percent_encode "$X_ACCESS_TOKEN")\", oauth_version=\"1.0\""

# Make request
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 \
  "$URL" \
  -H "Authorization: $AUTH_HEADER")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
```

**If valid (200):**

```bash
USERNAME=$(echo "$BODY" | jq -r '.data.username')
NAME=$(echo "$BODY" | jq -r '.data.name')
```

Display:

```
Credentials validated!

  Name: [NAME]
  Username: @[USERNAME]
```

Continue to Step 4.

**If invalid (401/403):**

```
Credential validation failed (HTTP [code]).

Common issues:
- API Key or Secret may have been copied incorrectly
- Access Token may not have Read and Write permissions
  (Regenerate tokens AFTER setting permissions to Read+Write)
- App may not be in a project with Free tier access

Try regenerating credentials and run /x-setup again.
```

Exit.

### Step 4: Save Credentials

Read the existing `.env.local` file, update or add the X variables:

```bash
ENV_FILE=~/Code/adventuresinclaude/.env.local
```

If the file exists, update existing values or append new ones:

- If `X_API_KEY=` line exists → replace it
- If not → append `X_API_KEY=[value]`
- Same for `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`

Use Edit tool to modify the file, or Write if creating fresh.

**Important:** Use `printf '%s'` not `echo` to avoid trailing newlines in values.

### Step 5: Verify

Read back the saved credentials and confirm:

```bash
grep 'X_' ~/Code/adventuresinclaude/.env.local
```

Display:

```
## X Setup Complete

  Name: [NAME]
  Username: @[USERNAME]
  Credentials saved to: ~/Code/adventuresinclaude/.env.local

X auto-posting is now enabled for /blogaic-post.

If credentials stop working, /blogaic-post will show:
  "X: Failed — Invalid credentials. Run /x-setup to reconfigure."

Just run /x-setup again to update.
```

## Notes

- `.env.local` is gitignored (`.env*.local` pattern in `.gitignore`)
- X free tier uses OAuth 1.0a (not OAuth 2.0 — that requires $100/month Basic tier)
- Access tokens don't expire by default on X (unlike LinkedIn's 60-day tokens)
- If you change app permissions, you must regenerate Access Token and Secret
- Free tier limit: ~500 posts/month (1,500 reads/month)
