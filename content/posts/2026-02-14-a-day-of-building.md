---
title: "A Day of Building"
date: 2026-02-14T23:00:00-07:00
tags: ["claude-code", "workflow", "meta"]
description: "63 commits across 5 repositories - what a full day of building with Claude Code actually looks like"
draft: true
---

Today was Valentine's Day. My gift to myself was building things.

By the end of the day, I'd pushed 63 commits across five repositories. Not because I was trying to hit a number — I wasn't counting until just now — but because Claude Code makes the distance between "I want this" and "this exists" remarkably short.

Here's what the day actually looked like.

---

## The Main Event: This Site

The biggest project was this site. [adventuresinclaude.ai](https://adventuresinclaude.ai) didn't exist when I woke up this morning.

It started with a text from [Michael Natkin](https://www.herbivoracious.com) telling me he'd had Claude move his food blog off WordPress onto Hugo. "Literally just plan mode," he said. I wasn't ready to move [feld.com](https://feld.com), but the idea of a dedicated space for Claude content stuck.

One Claude Code session later — brainstorm, design, implementation, deployment — and the site was live. Hugo, PaperMod theme, Vercel hosting. Two posts published. Then I kept going: related posts, reading progress bar, table of contents, Giscus comments, OG images, share buttons, email subscriptions via Kit, a custom 404 page, an AC monogram favicon, Google Search Console verification. 25 commits just for this repo.

The whole thing — from "tell me about Hugo" to a fully-featured blog with email subscriptions — happened in a single day. I wrote about the process in [Building This Site with Claude Code](/posts/2026-02-14-building-this-site/).

---

## AuthorMagic: Eight Tickets

While the blog was building in one terminal, AuthorMagic work was happening in others. Eight tickets closed today:

- **Rankings & Ratings redesign** — a five-section layout replacing the old single-table view
- **Book format discovery** — improved ordering, progress UI, and performance for finding book editions
- **Image uploads** — replaced the External IDs field with an actual image upload in the binding editor
- **Participant management** — name editing, status labels, first/last name fields for waitlist and personalized emails
- **Breadcrumb fix** — state was getting lost when navigating from a book to Sales Upload
- **Build display** — migrated sidebar footers from package.json versions to a Changelog build display

Plus a production release wrapping everything from the past few days, a fix for pre-existing unit test failures across three apps, and converting `.claude/` subdirectories to worktree symlinks so all eight of my parallel workspaces share the same configuration.

---

## CEOS: Five New Skills

[CEOS](https://github.com/IntensityMagic/ceos) — the Claude EOS (Entrepreneurial Operating System) implementation — got five new skills today:

- **ceos-kickoff** — structured EOS implementation sequencing
- **ceos-clarity** — the Clarity Break, a leadership reflection exercise
- **ceos-delegate** — Delegate and Elevate audit
- **ceos-checkup** — the EOS Organizational Checkup assessment
- **ceos-quarterly-planning** — structured quarterly planning sessions

I also retrofitted structural consistency across all existing skills (now 14 total), added a CLAUDE.md with the skill structure contract, expanded the IDS priority range, and added structured milestones to Rocks.

---

## CompanyOS: Three New Skills

[CompanyOS](https://github.com/IntensityMagic/companyos) — the AI-powered operations system for IntensityMagic — got three new skills:

- **co-support** — Help Scout customer support integration
- **co-launch** — launch cohort management via Supabase
- **co-search** — unified search across Linear, Gmail, Help Scout, Sentry, and Drive

Plus a practical fix: email drafts now persist to disk so they survive context compaction. Previously, if Claude's context window filled up mid-draft, the draft disappeared.

---

## Freshell: Security Hardening

[Freshell](https://github.com/EnnuiDev/freshell) — the open-source terminal multiplexer for AI coding agents — got ten commits focused on making it production-ready:

- GPG signature verification for the auto-updater (with rollback on failure)
- Path sandboxing for file API endpoints
- Server bound to 127.0.0.1 by default instead of 0.0.0.0
- React error boundaries for crash recovery
- Zod validation on settings endpoints
- Structured error logging throughout

Also added Shift+Enter as a newline shortcut (matching the pattern users expect from chat interfaces) and fixed a subtle bug where config corruption was silently falling back instead of logging and notifying.

---

## The Research Detour

In between all of this, I spent time researching [The Companion](https://github.com/The-Vibe-Company/companion) — a web UI for Claude Code that takes a completely different approach from Freshell. Where Freshell gives you the actual terminal (xterm.js + PTY), Companion replaces it with a structured chat view where tool calls become collapsible cards.

Neither approach is strictly better. The hybrid — a structured sidebar alongside the terminal — would combine both. Freshell's normalized event system already emits all the data; the missing piece is a UI panel to render it.

---

## What This Looks Like in Practice

Eight terminal windows. Eight git worktrees. Five repositories. Claude Code sessions running in parallel, each on its own branch, each doing its own work. I move between them — approving a design decision here, reviewing a diff there, steering a brainstorm somewhere else.

This isn't "vibe coding." I'm not generating code I don't understand. I'm directing specific work, reviewing every commit, making architectural decisions. Claude does the implementation. I do the product thinking and quality control.

63 commits. One day. Happy Valentine's Day.

---

Subscribe via [RSS](https://adventuresinclaude.ai/index.xml) to follow along. The source is always [on GitHub](https://github.com/bradfeld/adventuresinclaude).
