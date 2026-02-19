# AIC Project Tracker

Automated project directory for the Adventures in Claude Discourse community. Extracts project mentions from posts using Claude and maintains a pinned wiki topic.

## Prerequisites

- Python 3.10+
- Access to the Discourse droplet (24.144.80.161)
- Anthropic API key
- Discourse API key (already on droplet)

## Setup

### 1. Install dependencies

```bash
ssh root@24.144.80.161
mkdir -p /opt/project-tracker
# Copy files to droplet (from local machine):
# scp discourse/project-tracker/*.py discourse/project-tracker/requirements.txt root@24.144.80.161:/opt/project-tracker/
pip3 install -r /opt/project-tracker/requirements.txt
```

### 2. Set environment variables

Create `/opt/project-tracker/.env`:

```bash
DISCOURSE_URL=https://community.adventuresinclaude.ai
DISCOURSE_API_KEY=<from GCP SM: aic_discourse_api_key>
DISCOURSE_API_USERNAME=bfeld
DISCOURSE_WEBHOOK_SECRET=<generate: openssl rand -hex 32>
ANTHROPIC_API_KEY=<from GCP SM or existing>
WIKI_POST_ID=<set after creating topic>
WIKI_TOPIC_ID=<set after creating topic>
TRACKER_PORT=9100
```

### 3. Run the backfill

```bash
cd /opt/project-tracker
export $(cat .env | xargs)

# Preview first (outputs draft to stdout)
python3 backfill.py > draft.md
cat draft.md  # Review the draft

# When satisfied, create the topic
python3 backfill.py --create-topic
# Note the WIKI_TOPIC_ID and WIKI_POST_ID from the output
# Update .env with these values
```

### 4. Configure Discourse webhook

In Discourse admin (Settings > Webhooks):

1. **Payload URL**: `http://127.0.0.1:9100/webhook`
2. **Content Type**: `application/json`
3. **Secret**: Same value as `DISCOURSE_WEBHOOK_SECRET` in `.env`
4. **Events**: Check `post_created` and `post_edited`
5. **Categories**: All (or limit to 5, 6, 7, 8)

Since the listener runs on localhost, the webhook calls stay on-box — no external port exposure needed.

### 5. Set up systemd service

Create `/etc/systemd/system/project-tracker.service`:

```ini
[Unit]
Description=AIC Project Tracker
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/project-tracker
EnvironmentFile=/opt/project-tracker/.env
ExecStart=/usr/bin/python3 /opt/project-tracker/tracker.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable project-tracker
systemctl start project-tracker
systemctl status project-tracker
```

### 6. Send the community broadcast

After everything is running, create a new topic in Discussion (category 8) announcing the project directory. See the design doc for the broadcast message template.

## Monitoring

```bash
# Check service status
systemctl status project-tracker

# View logs
journalctl -u project-tracker -f

# Check wiki post
curl -s -H "Api-Key: $DISCOURSE_API_KEY" -H "Api-Username: bfeld" \
  "$DISCOURSE_URL/posts/$WIKI_POST_ID.json" | python3 -m json.tool
```

## Files

| File | Purpose |
|------|---------|
| `tracker.py` | Webhook listener — runs continuously as a systemd service |
| `backfill.py` | One-time script to scan existing posts and bootstrap the directory |
| `requirements.txt` | Python dependencies |
