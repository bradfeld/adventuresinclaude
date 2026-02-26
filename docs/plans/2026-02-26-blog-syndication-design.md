# AIC Blog Syndication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically syndicate blog posts from AIC community members into Discourse via RSS, with email notifications and per-post discussion.

**Architecture:** Discourse's bundled RSS polling plugin imports each blog post as a topic in a "Member Blogs" category. Category notification defaults send email to all members. Members opt out by unwatching the category. Zero custom code.

**Tech Stack:** Discourse admin UI, Discourse API, Rails console (for user backfill)

**Current state:** RSS polling plugin already enabled (`rss_polling_enabled: true`, 30-min polling). No feeds configured. No embeddable hosts. 32 active users. Existing categories: Introductions (5), Projects (6), Tips & Techniques (7), Discussion (8), Meta (9).

---

### Task 1: Create "Member Blogs" Category

**Step 1: Create the category via Discourse API**

```bash
DISCOURSE_KEY=$(gcloud secrets versions access latest --secret=aic_discourse_api_key --project=authormagic-480416 --account=brad@intensitymagic.com)

curl -X POST "https://community.adventuresinclaude.ai/categories.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Member Blogs",
    "slug": "member-blogs",
    "color": "8B5CF6",
    "text_color": "FFFFFF",
    "description": "Blog posts from community members, automatically syndicated via RSS. Reply to any post to discuss!",
    "position": 5
  }'
```

Expected: JSON response with new category `id`. **Record this ID** — needed for Tasks 2-4.

**Step 2: Verify the category exists**

```bash
curl -s -H "Api-Key: $DISCOURSE_KEY" -H "Api-Username: bfeld" \
  "https://community.adventuresinclaude.ai/categories.json" | \
  python3 -c "import json,sys; [print(f\"{c['id']}: {c['name']}\") for c in json.load(sys.stdin)['category_list']['categories']]"
```

Expected: "Member Blogs" appears in the list with the new ID.

---

### Task 2: Set Category Notification Default

The `default_categories_watching_first_post` site setting makes all **new** users auto-watch-first-post on the category. This only affects future users.

**Step 1: Set the site setting via API**

```bash
# Replace CATEGORY_ID with the ID from Task 1
curl -X PUT "https://community.adventuresinclaude.ai/admin/site_settings/default_categories_watching_first_post.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{"default_categories_watching_first_post": "CATEGORY_ID"}'
```

**Step 2: Verify the setting**

```bash
curl -s -H "Api-Key: $DISCOURSE_KEY" -H "Api-Username: bfeld" \
  "https://community.adventuresinclaude.ai/admin/site_settings/default_categories_watching_first_post.json" | \
  python3 -m json.tool
```

Expected: Setting value includes the category ID.

---

### Task 3: Backfill Existing Users

The site setting only applies to new users. For the 32 existing users, set their notification level on the new category via Rails console.

**Step 1: Backfill via SSH + Rails runner**

```bash
# Replace CATEGORY_ID with the actual ID
ssh -o StrictHostKeyChecking=no root@24.144.80.161 'docker exec app rails runner "
category = Category.find(CATEGORY_ID)
# Notification level 4 = watching first post
User.real.where(active: true).find_each do |user|
  CategoryUser.set_notification_level_for_category(user, category, CategoryUser.notification_levels[:watching_first_post])
end
puts \"Set watching_first_post for #{User.real.where(active: true).count} users on category #{category.name}\"
"'
```

Expected: Output like "Set watching_first_post for 32 users on category Member Blogs"

**Step 2: Verify one user's notification level**

```bash
ssh -o StrictHostKeyChecking=no root@24.144.80.161 'docker exec app rails runner "
category = Category.find(CATEGORY_ID)
cu = CategoryUser.where(category: category).first
puts \"User: #{cu.user.username}, Level: #{cu.notification_level} (4=watching_first_post)\"
"'
```

Expected: Level = 4

---

### Task 4: Configure RSS Feed via Embedding

The RSS polling plugin uses the Embedding settings to map host domains to categories. Each blog domain gets an "embeddable host" entry pointing to the "Member Blogs" category.

**Step 1: Add adventuresinclaude.ai as an embeddable host**

```bash
# Replace CATEGORY_ID with the actual ID
curl -X POST "https://community.adventuresinclaude.ai/admin/embeddable_hosts.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{
    "embeddable_host": {
      "host": "adventuresinclaude.ai",
      "category_id": CATEGORY_ID
    }
  }'
```

**Step 2: Add the RSS feed URL to the polling plugin**

Navigate to the admin UI: `https://community.adventuresinclaude.ai/admin/plugins/discourse-rss-polling`

Add feed: `https://adventuresinclaude.ai/index.xml`

Note: The RSS polling plugin feed configuration may not have an API endpoint — if not, this step must be done via the admin UI in the browser.

**Step 3: Set embed_by_username to "system" (or "bfeld")**

```bash
curl -X PUT "https://community.adventuresinclaude.ai/admin/site_settings/embed_by_username.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{"embed_by_username": "system"}'
```

This controls which user is shown as the topic author for RSS-imported posts. "system" keeps it neutral; "bfeld" would show you as the author.

---

### Task 5: Test the Pipeline

**Step 1: Trigger a poll manually (if available)**

Check if manual polling is available at `https://community.adventuresinclaude.ai/admin/plugins/discourse-rss-polling` — there may be a "Poll Now" button. Otherwise, wait up to 30 minutes for the next automatic poll.

**Step 2: Verify a topic was created**

```bash
curl -s -H "Api-Key: $DISCOURSE_KEY" -H "Api-Username: bfeld" \
  "https://community.adventuresinclaude.ai/c/member-blogs.json" | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for t in data.get('topic_list', {}).get('topics', [])[:5]:
    print(f\"{t['id']}: {t['title']}\")"
```

Expected: Recent blog posts from adventuresinclaude.ai appear as topics.

**Step 3: Verify email notification**

Check Brad's email for a notification about the new topic in Member Blogs. If no email arrives within a few minutes, check Discourse email logs at `/admin/email/sent`.

**Step 4: Test reply-by-email**

Reply to the notification email. Verify the reply appears as a comment on the Discourse topic.

---

### Task 6: Create "Submit Your Blog" Pinned Topic

**Step 1: Create the pinned instructions topic**

```bash
curl -X POST "https://community.adventuresinclaude.ai/posts.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Submit Your Blog RSS Feed",
    "raw": "If you have a blog about building with AI, share your RSS feed URL here and we'\''ll add it to the syndication.\n\n**How it works:**\n\n1. Post your blog'\''s RSS feed URL as a reply below\n2. I'\''ll review it and add it to the feed list\n3. New posts from your blog will automatically appear in this category\n4. Everyone in the community gets an email notification for each new post\n5. People can discuss your posts by replying right here in Discourse (or by replying to the email)\n\n**To find your RSS feed URL:**\n\n- Hugo/Jekyll/most static sites: `yourblog.com/index.xml` or `yourblog.com/feed.xml`\n- WordPress: `yourblog.com/feed/`\n- Substack: `yourblog.substack.com/feed`\n- Ghost: `yourblog.com/rss/`\n\n**To opt out of email notifications:** Click the bell icon on this category and change to Normal or Muted.\n\n---\n\n*Currently syndicated blogs:*\n\n- [Adventures in Claude](https://adventuresinclaude.ai) — Brad Feld",
    "category": CATEGORY_ID
  }'
```

**Step 2: Pin the topic**

```bash
# Replace TOPIC_ID with the ID from the response above
curl -X PUT "https://community.adventuresinclaude.ai/t/TOPIC_ID/status.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{"status": "pinned", "enabled": "true"}'
```

---

### Task 7: Announce to the Community

**Step 1: Create announcement topic in Discussion (category 8)**

```bash
curl -X POST "https://community.adventuresinclaude.ai/posts.json" \
  -H "Api-Key: $DISCOURSE_KEY" \
  -H "Api-Username: bfeld" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New: Member Blogs category — share your blog with the community",
    "raw": "I just set up a new **Member Blogs** category that automatically syndicates blog posts from community members.\n\n**How it works:**\n\n- If you have a blog, post your RSS feed URL in the [Submit Your Blog](https://community.adventuresinclaude.ai/t/submit-your-blog-rss-feed/TOPIC_ID) topic\n- New posts from syndicated blogs appear automatically in the Member Blogs category\n- You'\''ll get an email for each new post (like any other Discourse topic)\n- Reply to the email or in Discourse to discuss\n\n**To stop getting emails** about blog posts: click the bell icon on the Member Blogs category and set it to Normal or Muted.\n\nMy blog ([Adventures in Claude](https://adventuresinclaude.ai)) is already in there as the first feed. Would love to see yours.",
    "category": 8
  }'
```

---

### Task 8: Document in Discourse Reference

**Step 1: Update the discourse community doc**

Add to `~/.claude/docs/discourse-community.md` under Categories:

```
| Member Blogs | CATEGORY_ID | memberblogs@community.adventuresinclaude.ai |
```

And add a new section:

```markdown
## RSS Blog Syndication

- **Plugin**: discourse-rss-polling (bundled with core, already enabled)
- **Polling frequency**: Every 30 minutes
- **Feed management**: Admin UI at `/admin/plugins/discourse-rss-polling`
- **Host→category mapping**: Admin > Customize > Embedding > Embeddable Hosts
- **Adding a new blog**: Add embeddable host for the domain + add RSS feed URL in plugin settings
- **Notification default**: Watching First Post (all members get email per new blog post)
- **Opt out**: Member changes category notification to Normal or Muted
```

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Individual emails vs daily digest | Individual | Low volume (~1-5/week), enables per-post discussion, zero custom code |
| Full content vs excerpt | RSS feed default | Let RSS provide what it provides; most feeds include excerpt + link |
| Self-service vs admin-only feed mgmt | Admin approval | Quality control, light touch (~30s per feed) |
| Custom service vs native Discourse | Native | RSS polling is bundled, notification system handles email. No maintenance burden. |
| Topic author for imported posts | "system" user | Keeps it neutral; member's name appears in the blog post content itself |
