---
title: "Running a Company on Markdown Files"
date: 2026-02-21T10:00:00-07:00
tags: ["companyos", "claude-code", "operations", "eos", "skills"]
description: "CompanyOS: a skills-only system that turns Claude Code into the operating layer for an entire company"
draft: false
---

When Anthropic released [Claude CoWork](https://support.claude.com/en/articles/13345190-getting-started-with-cowork), I got excited. A multi-agent system where Claude handles business operations, not just code. I tried it immediately. And I was frustrated almost immediately.

The UI was limited. The workflows were rigid. And the biggest problem - it had no overlap with Claude Code. I was already spending my entire day in Claude Code across eight parallel worktrees, building and shipping software. CoWork wanted me to context-switch into a separate web interface to do operations. That's the wrong direction. I wanted operations to come to me, in the tool I was already using.

So I built CompanyOS. It's a skills-only system. No application code. No web UI. Just markdown files that teach Claude Code how to run a company.

---

CompanyOS is a git repo with nothing in it that looks like software. No `package.json`. No `src/` directory. No deployed web service. The repo contains markdown files, a setup script, and some SQL migrations. That's it.

The markdown files are skills - structured documents that teach Claude Code how to perform specific business operations. When I say "draft an email to our alpha users," Claude recognizes the intent, loads the `co-comms` skill, and follows a multi-step workflow: detect who's sending (via `git config`), load the sender's voice profile, pull recent emails to the same recipient for tone calibration, draft the message, save it to disk, and wait for explicit approval before sending.

Skills only. No agents orchestrating other agents. No workflow engine. No task queue. Each skill is a single markdown file with a seven-section template: frontmatter, when to use, context, process, output format, guardrails, and a standalone mode that works without any external system connections.

The "skills only" constraint was deliberate. CoWork's approach is to build an orchestration layer on top of AI - agents that manage agents, workflows that chain steps, a runtime that coordinates everything. CompanyOS inverts this. Claude Code is already an agent with tool access, memory, and context management. It doesn't need another orchestration layer. It needs domain knowledge. Skills are domain knowledge in a format Claude already understands.

---

There are twelve skills:

- **co-comms** - Draft, review, and send email. Detects who's sending via `git config`, loads their voice profile, calibrates tone from recent emails to the same recipient, persists every draft to disk so it survives context compaction, and can save to Gmail Drafts for later review. Sending requires explicit approval - any edit resets the gate.
- **co-support** - Run the full Help Scout support lifecycle. Search conversations, read threads, triage by priority, draft replies, add internal notes, tag, and close - all without opening the Help Scout UI. Tags, templates, and auto-tagging rules live as YAML config files in the repo.
- **co-search** - Fan out a single query across Linear, Gmail, Help Scout, Notion, Sentry, and Google Drive in parallel. Route to relevant sources using keyword detection - billing queries hit Help Scout and Stripe, bug reports hit Sentry and Linear - then deduplicate results across systems.
- **co-l10-prep** - Collect eight scorecard metrics before the weekly [EOS](https://www.eosworldwide.com/) L10 meeting. Run parallel SQL queries against Supabase and Linear API calls to pull active users, open bugs, resolved issues, waitlist numbers, and CompanyOS usage stats into a single formatted table.
- **co-launch** - Manage product launch cohorts from creation through completion. Track participants through a lifecycle - added, invited, active, feedback submitted, and completed - with timestamp tracking at each stage. Delegate message drafting to co-comms and scheduling to Vercel cron.
- **co-feedback** - Aggregate user feedback from Linear tickets, Marker.io visual bug reports, and Help Scout conversations into patterns. Categorize by theme, identify recurring issues, and produce summaries for product decisions. Token-budgeted to avoid context overflow on large queries.
- **co-ops** - Log decisions and look up company conventions. Each entry records what was decided, the rationale, who led it, which products it affects, and when to revisit. Search the full decision history when someone asks "what's our policy on X?"
- **co-calendar** - Schedule meetings, but challenge whether the meeting is needed first. Default to async. When a meeting is justified, check availability, create an agenda, and set it to 30 minutes. No meetings without an agenda, and anyone can cancel if the topic can be handled async.
- **co-meetings** - Pull meeting content from [Granola](https://www.granola.so/) after meetings happen. Retrieve AI-generated summaries, user notes, full transcripts, and action items. Boundary with co-calendar is clean: calendar handles before the meeting, meetings handles after.
- **co-content** - Create marketing content with distinct brand voice profiles per product. Each product has its own tone - empowering for AuthorMagic, trustworthy and clear for MedicareMagic, and encouraging for MyHealthMagic. Get outline approval before writing full content.
- **co-secrets** - Store, rotate, and validate API keys and credentials through GCP Secret Manager. Self-describing JSON format so sync scripts know which environment variables to generate. Shows commands for the user to execute rather than running destructive operations directly.
- **co-five-whys** - Run root cause analysis using Toyota's Five Whys combined with guided discovery. Ask "why?" iteratively, never answer for the user, reflect back what you hear, and stop when you hit something actionable. End with questions, not solutions.

Each one is a markdown file. The skill tells Claude what to do, in what order, with what guardrails. Claude's existing capabilities - tool use, MCP connections, context management - handle the execution. The skill just provides the playbook.

---

Every skill must work without MCP servers connected. No API access at all. This sounds like an edge case, but it's actually a design forcing function. When you require a skill to work without external systems, you separate the thinking from the API calls.

Take co-support. With MCP, it searches Help Scout conversations, reads full threads, drafts replies, and sends them through the REST API. Without MCP, I paste the customer's message into the conversation and co-support still triages it, categorizes the issue, drafts a response in the right tone, and formats it as copy-ready text I can paste into Help Scout myself. The intelligence - knowing how to triage, what tone to use, when to escalate - lives in the markdown. The API calls are just plumbing.

This is where CoWork's architecture breaks down. If the orchestration layer can't reach its APIs, nothing works. With skills-only, the worst case is that I copy and paste instead of the system sending directly. The skill still runs. The output is identical.

---

The hardest lesson came from an email.

Early on, co-comms drafted a message and sent it without waiting for approval. The email was fine - nothing embarrassing - but the principle was wrong. An AI system sent a real email to a real person on my behalf without my explicit sign-off.

I added a hard gate. The user must say "send" or "approve" after seeing the final draft. Any edit - even fixing a typo - resets the approval. You see the updated version, then approve again. This rule is enforced at two levels: in the skill definition itself, and in a separate `co-protected-workflows.md` rule that applies globally.
The broader principle: anything irreversible gets an explicit approval loop. Sending emails, closing support tickets, posting to external services. Claude can draft, analyze, recommend, and prepare all day long. But the moment something needs to leave the virtual building, a human needs to say yes.

---

Skill activation works through trigger definitions, not explicit invocation. Each skill has keywords and intent patterns:

```json
"co-support": {
  "triggers": {
    "keywords": ["help scout", "support", "ticket", "customer"],
    "intentPatterns": ["(check|review|handle).*?(support|ticket|conversation)"]
  }
}
```

You say "check the support queue" and co-support loads. You say "draft a reply to ticket 4523" and co-comms loads with the conversation context. You don't need to know the skill names. You describe what you want in natural language and Claude matches the intent to the right skill. This is the whole advantage of building on Claude Code instead of a separate system - the conversational interface is already there.

---

CompanyOS measures itself. Every skill invocation fires a Claude Code hook that logs the event to a database table - who used it, which skill, when. This happens silently via a bash script that always exits 0 so it never blocks Claude Code.

Then, when co-feedback runs a weekly pattern analysis, it pulls from that same table to show which skills are being used and how often. The system that runs the business reports on how much it's running the business. The telemetry loop closes.

---

The whole thing is about 2,000 lines of markdown across twelve skill files, five commands, two agents, and a handful of rules. It connects to eight external systems through MCP servers - Linear, Gmail, Google Calendar, Help Scout, Notion, Sentry, Stripe, and Granola. The database footprint is four tables.

The skills-only bet has held up. No orchestration engine. No workflow runtime. No separate UI. Just markdown files that give Claude Code the domain knowledge to run business operations, deployed through the same tool I already use to build software. CoWork showed me what I wanted. Claude Code got me there.

---

Subscribe via [RSS](https://adventuresinclaude.ai/index.xml) to follow along. The source is always [on GitHub](https://github.com/bradfeld/adventuresinclaude).
