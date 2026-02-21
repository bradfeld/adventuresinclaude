---
title: "Running a Company on Markdown Files"
date: 2026-02-21T10:00:00-07:00
tags: ["companyos", "claude-code", "operations", "eos", "skills"]
description: "How two people run a multi-product SaaS company through Claude Code with zero employee overhead"
draft: true
---

Daniel and I run [IntensityMagic](https://intensitymagic.com) - six SaaS products, real users, real revenue. Two people. No employees. The entire company operates through Claude Code.

I don't mean we use Claude Code to write software. We do that too. I mean the actual business operations - email, customer support, meeting prep, launch management, feedback analysis, secrets rotation, content creation - all of it runs through a system we built called CompanyOS.

---

CompanyOS is a git repo with no application code in it. No `package.json`. No `src/` directory. No deployed web service. The repo contains markdown files, a setup script, and some SQL migrations. That's it.

The markdown files are skills - structured documents that teach Claude Code how to perform specific business operations. When I say "draft an email to our alpha users," Claude recognizes the intent, loads the `co-comms` skill, and follows a multi-step workflow: detect who's sending (me or Daniel, via `git config`), load the sender's voice profile, pull recent emails to the same recipient for tone calibration, draft the message, save it to disk, and wait for explicit approval before sending.

There are twelve skills covering everything we do:

- **co-comms** - Email drafting and sending with per-sender voice profiles
- **co-support** - Full Help Scout lifecycle: triage, respond, tag, escalate, close
- **co-search** - Fan out a query across Linear, Gmail, Help Scout, Notion, Sentry, and Google Drive simultaneously
- **co-l10-prep** - Collect eight scorecard metrics before our weekly [EOS](https://www.eosworldwide.com/) L10 meeting
- **co-launch** - Manage product launch cohorts, participants, and messaging
- **co-feedback** - Aggregate user feedback from multiple sources into patterns
- **co-ops** - Decision logging and company conventions
- **co-calendar** - Scheduling that challenges whether you actually need a meeting
- **co-meetings** - Pull notes from [Granola](https://www.granola.so/) after meetings happen
- **co-content** - Marketing copy with distinct brand voices per product
- **co-secrets** - GCP Secret Manager operations
- **co-five-whys** - Root cause analysis using guided discovery

Each skill follows the same seven-section template: frontmatter, when to use, context, process, output format, guardrails, and a standalone mode that works without any external system connections.

---

That last part - standalone mode - is a design decision I'm particularly attached to. Every skill must work without MCP servers connected. No API access at all. This sounds like an edge case, but it's actually a forcing function. When you require a skill to work without external systems, you separate the thinking from the API calls.

Take co-l10-prep. With MCP, it runs parallel SQL queries against Supabase and Linear API calls to pull eight metrics automatically. Without MCP, it prompts me conversationally for each number and still produces the same formatted scorecard table. The intelligence - knowing which metrics matter, how to format them, what the targets are - lives in the markdown. The API calls are just data retrieval.

This means if Supabase is down, or Linear's API is slow, or I'm on a plane, the skill still works. I just type the numbers instead of the system fetching them.

---

The hardest lesson came from an email.

Early on, co-comms drafted a message and sent it without waiting for my approval. The email was fine - nothing embarrassing - but the principle was wrong. An AI system sent a real email to a real person on my behalf without my explicit sign-off.

We added a hard gate. Now, the user must say "send" or "approve" after seeing the final draft. Any edit - even fixing a typo - resets the approval. You see the updated version, then approve again. This rule is enforced at two levels: in the skill definition itself, and in a separate `co-protected-workflows.md` rule that applies globally. Belt and suspenders.

The broader principle: anything irreversible gets an explicit approval loop. Sending emails, closing support tickets, posting to external services. Claude can draft, analyze, recommend, and prepare all day long. But the moment something leaves the building, a human says yes.

---

Daniel is my co-founder and he's not a developer. His entire setup is one command:

```bash
gh repo clone IntensityMagic/companyos && cd companyos && ./scripts/bootstrap-new-user.sh
```

This installs Claude Code, clones the repo, symlinks all the skills into his environment, configures MCP servers, and sets up auto-updates. When I push a new skill or update an existing one, Daniel gets it on his next auto-sync. He never sees the internals. He just talks to Claude and the skills activate based on what he's asking about.

The skill activation works through trigger definitions. Each skill has keywords and intent patterns:

```json
"co-support": {
  "triggers": {
    "keywords": ["help scout", "support", "ticket", "customer"],
    "intentPatterns": ["(check|review|handle).*?(support|ticket|conversation)"]
  }
}
```

Daniel says "check the support queue" and co-support loads. He says "draft a reply to ticket 4523" and co-comms loads with the conversation context. He doesn't need to know the skill names or how any of it works.

---

One of my favorite details: CompanyOS measures itself.

Every skill invocation fires a Claude Code hook that logs the event to a Supabase table - who used it, which skill, when. This happens silently via a bash script that always exits 0 so it never blocks Claude Code.

Then, when co-l10-prep collects scorecard metrics for our weekly meeting, one of the eight metrics is "CompanyOS Tasks Completed via Claude." The system that runs the business reports on how much it's running the business. The telemetry loop closes.

---

The EOS integration goes deeper than just the scorecard. Our decision log in `decisions/` follows EOS documentation patterns - each entry records what was decided, the rationale, who led it, which products it affects, and when to revisit. The weekly L10 meeting prep is a core EOS practice. Even co-calendar's default behavior - challenge whether a meeting is needed before scheduling one - reflects EOS's meeting pulse philosophy applied to a two-person team.

I've been running companies on EOS for years. CompanyOS is what it looks like when the operating system for a company is literally an operating system.

---

The whole thing is about 2,000 lines of markdown across twelve skill files, five commands, two agents, and a handful of rules. It connects to eight external systems through MCP servers - Linear, Gmail, Google Calendar, Help Scout, Notion, Sentry, Stripe, and Granola. The database footprint is four tables in a `companyos` schema that shares Supabase with the products it helps operate.

Neither Daniel nor I log into individual system UIs for routine operations anymore. Help Scout, Linear, Gmail, Google Calendar - we interact with all of them through Claude Code. The skill layer means we don't need to remember how each system works. We describe what we want and the skill handles the specifics.

Two people, twelve skills, zero employee overhead. The repo is private (it contains our operational patterns), but the architecture is straightforward - markdown files that teach Claude Code how to do your job. That's CompanyOS.

---

Subscribe via [RSS](https://adventuresinclaude.ai/index.xml) to follow along. The source is always [on GitHub](https://github.com/bradfeld/adventuresinclaude).
