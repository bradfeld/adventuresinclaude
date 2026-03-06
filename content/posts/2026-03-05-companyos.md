---
title: "CompanyOS: Running a Business From the Terminal"
date: 2026-03-05T18:24:00-07:00
description: "How I built a system of markdown skills, automated agents, and MCP integrations that turns Claude Code into a universal interface for business operations."
draft: true
tags: ["claude-code", "companyos", "ai", "workflow"]
---

I was sitting in a magic-platform worktree debugging a Supabase migration when a customer support email came in. Without switching windows, I typed "check the latest Help Scout tickets" and Claude pulled the conversation, showed me the customer's history, and drafted a response. I reviewed it, said "send it," and went back to my migration.

That moment is what CompanyOS is for. Claude Code is already the interface to my codebase. I decided to make it the interface to the entire business.

---

CompanyOS is a collection of markdown files - skills, agent definitions, and rules - that teach Claude Code how to run business operations. There's no framework. No SDK. No build step. A skill is a markdown file with instructions that Claude follows when it recognizes the right context.

The system has three layers, and each one does something different.

---

**Skills** are the primary interface. I have 18 of them, each prefixed with `co-` to avoid collisions with personal skills. When I say "draft an email to our alpha users," the `co-comms` skill activates. It knows our email conventions, our tone guidelines, which Gmail identity to send from, and that external emails always start as drafts for human review. When I say "what happened in our L10 meeting," the `co-meetings` skill activates and pulls context from Granola transcripts.

Skills are just markdown. Each one has a "When to Use" section with trigger scenarios, a "Process" section with step-by-step instructions, and a "Guardrails" section with safety rules. Claude reads these on session start and matches them to context. The whole activation mechanism is pattern matching on natural language - no slash commands required, though those work too.

**Agents** handle orchestration. They're not persistent daemons - they're instruction sets that Claude dispatches as subtasks via the Task tool. If I say "summarize this week's feedback and draft responses," Claude dispatches `co-feedback-analyst` to categorize the feedback, then uses `co-comms` to draft the responses. Agents are for multi-step workflows where one step's output feeds the next.

**Automated Jobs** run without a human. These are Supabase Edge Functions triggered by pg_cron or webhooks. The email agent polls Gmail every five minutes on weekdays between 7 AM and 9 PM Eastern. It classifies each message - some get auto-replies, others get routed as tasks to Linear. The support agent triages Help Scout tickets every 30 minutes. A weekly skill report emails usage analytics every Friday. These run on Deno in Supabase's edge runtime, with config baked at deploy time.

---

The 18 co-* skills break down into five categories.

*Communications* - `co-comms` handles email drafting with identity awareness and tone guidelines. `co-content` creates marketing copy and blog posts. `co-board-update` summarizes board meetings into structured emails.

*Operations* - `co-ops` is the company knowledge base - contacts, conventions, decisions. `co-calendar` handles scheduling and meeting prep. `co-meetings` processes meeting notes and action items. `co-l10-prep` collects scorecard metrics before the weekly Level 10 meeting. `co-recurring` manages scheduled background jobs.

*Customer-facing* - `co-support` handles customer conversations and ticket triage. `co-feedback` analyzes user feedback patterns. `co-launch` manages product launch cohorts and messaging.

*Infrastructure* - `co-audit` verifies CompanyOS setup health. `co-secrets` manages API keys via GCP Secret Manager. `co-pipeline` runs multi-stage deployment pipelines. `co-search` searches across business tools when information is scattered.

*Quality of life* - `co-music` controls Spotify playback. `co-wisdom` delivers a motivational nudge when someone needs one. `co-five-whys` runs structured root-cause analysis.

There's a separate set of 21 `ceos-*` skills in their own repo that digitize the Entrepreneurial Operating System. These handle weekly L10 meetings, quarterly Rock tracking, the accountability chart, scorecard metrics, people evaluations, and the full EOS toolkit. They live apart from the operational skills because EOS is its own discipline with its own vocabulary.

---

MCP is the glue. Skills describe *what* to do. MCP provides *access* to do it. CompanyOS connects to ten systems: Linear for issue tracking, Supabase for database operations, Stripe for billing, Google Workspace for email and calendar and Drive, Resend for transactional email, Sentry for error monitoring, Vercel for deployments, Help Scout for customer support, Notion for documentation, and Spotify for music.

All external actions are audited. Claude Code hooks log every email sent, every Stripe operation, every support ticket action. Skill invocations are tracked in a Supabase table with who invoked which skill and when. The weekly skill report aggregates this into a usage summary.

---

The part I find most useful is the multi-company architecture. CompanyOS isn't one repo - it's a core repo plus config repos per company. My company runs `companyos-intensitymagic`. A different company would run `companyos-theirname`. Skills live in the config repo. Each company can customize freely.

Here's where it gets interesting. When a skill changes in a config repo, a GitHub Actions workflow detects the change and automatically creates a PR on the core CompanyOS repo. If I accept it, the skill becomes available to all companies. If I reject it, it stays company-specific. This means companies can innovate independently without forking. The core stays clean. Good ideas flow upstream automatically.

The setup is one command: `./setup.sh` symlinks skills and rules into `~/.claude/skills/` and `~/.claude/rules/`. A new team member runs that script and gets every skill immediately. When skills update upstream, `git pull` plus `setup.sh` propagates the changes.

---

The whole thing is about 40 markdown files, a handful of Edge Functions, and a setup script. No runtime. No server. No framework to maintain. The skills are version-controlled, code-reviewed, and deployed the same way I deploy code - because they *are* code. They just happen to be written in English.

I'm starting to extend this to other companies. If you're interested in being a very early user, [send me an email](mailto:brad@intensitymagic.com).
