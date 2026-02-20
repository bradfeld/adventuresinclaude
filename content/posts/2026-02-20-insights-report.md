---
title: "A Week of Claude Code Insights"
date: 2026-02-20T22:30:00-07:00
description: "Claude Code's /insights command analyzed a week of my usage. 1,397 messages, 150 hours of compute, and a brutally honest breakdown of where things go wrong."
draft: false
tags: ["claude-code", "insights", "workflow", "automation"]
---

Claude Code shipped a `/insights` command this week. I typed it in and waited. A few minutes later I had a full breakdown of my usage over the previous seven days.

The numbers: 1,397 messages across 114 sessions. 150 hours of compute time. 91 commits. 435 files touched. 28,509 lines added, 970 removed.

I ran 77 parallel session overlaps during the week - moments where multiple Claude Code instances were working simultaneously in different worktrees. 27% of my total messages happened during these overlaps. The multi-worktree setup I built for the Magic Platform monorepo - eight worktrees, each on its own branch - is finally getting used the way I designed it.

---

The report classified my sessions into five areas. Software development and ticket chains dominated with about 20 sessions - implementing Linear tickets across multiple projects, TypeScript changes, code reviews, multi-file edits. Deployment and DevOps workflows took 10 sessions. Content creation and publishing got 8. Community and communication management got 7. Infrastructure and hardware setup got 5.

The tool usage stats tell the real story. Bash was the top tool at 2,230 calls. But the second and fourth most used tools were TaskUpdate (1,116) and TaskCreate (489). That's 1,605 combined calls for task management - Claude spawning and managing sub-agents on my behalf, running parallel code reviews, quality gates, and multi-file changes.

The most common thing I asked for was committing and pushing code (5 sessions). Git operations came second (4). Deployment workflows third (4). These are exactly the workflows I've built custom `/commit`, `/staging`, and `/production` commands to handle. The automation is doing its job.

---

Three things worked well this week.

The autonomous end-to-end development pipeline continued to be the workhorse. Claude picks up a Linear ticket, creates a feature branch, implements changes, runs quality gates, commits, pushes, and updates Linear status. I provide guidance and review the plan. It does the rest.

Ticket chains - where Claude processes multiple Linear tickets sequentially, implementing and committing each one before moving to the next - handled the batch work. The staging workflows merge multiple branches, update changelogs, and coordinate across worktrees.

The content and ops automation broadened. Drafting blog posts from daily notes, publishing to Hugo, sharing to LinkedIn and X, sending personalized emails, creating Google Contacts, inviting people to Discourse communities, and restyling the forum to match the website. Claude is handling the entire publishing and community management workflow alongside the engineering work.

---

The friction analysis is where it gets honest.

14 out of 30 friction events were "wrong approach." Claude over-engineered a 15-task plan for a docs-only ticket. It used raw API calls instead of an existing blog publishing skill. It assumed files didn't exist without checking git history. It synced from the wrong remote. This is nearly half my friction, and it's a planning problem, not a coding problem.

8 friction events were buggy code. 5 were context limit errors - sub-agents and the main session hitting token walls during ambitious multi-step workflows like cross-chain code reviews.

The git and worktree configuration fragility keeps recurring. My multi-worktree setup and pre-commit hooks are a persistent source of failures. Secret files getting committed, symlink artifacts being auto-staged, hooks silently deleting config files, and orphaned git processes hanging deployments. One session this week triggered GitHub's Push Protection because Claude accidentally committed `.env.development.local.preview` files containing Supabase keys. It had to rewrite the entire git history to scrub them - then still managed to successfully push and pass CI by the end of the session.

Claude also makes wrong assumptions about my environment. It assumed my Raspberry Pi had a monitor connected and suggested re-flashing a pre-loaded SSD. It manually posted a blog via raw API calls instead of using the existing `/blog-feld` skill, missing Gutenberg block markup and voice profile formatting.

---

The report suggested three things on the horizon.

A self-healing git pipeline with pre-flight checks - an autonomous agent that catches predictable failure modes (worktree artifacts, orphaned processes, committed secrets, hook failures) before they derail workflows. This could eliminate 10+ of those 14 wrong-approach friction events.

Parallel review agents with context budgeting - an orchestration pattern that pre-calculates how much context each sub-agent gets, chunks review scopes accordingly, and synthesizes results through a lightweight coordinator. This would make the cross-chain reviews that currently crash into token walls actually work.

An autonomous content pipeline with voice enforcement - a structured pipeline that enforces my voice profile as a validation gate before any content publishes. No more correcting Oxford commas or wrong first-person claims about time spent.

---

The satisfaction rate came in at 84% across the sessions analyzed. The fully-achieved rate was 73%. Given what I'm asking - end-to-end deployment pipelines, cross-platform publishing, email drafting in specific voice profiles, infrastructure debugging, and multi-repository git workflows - those numbers track with my experience. Most things work. The failures are infrastructure-level, not comprehension-level.

The response time distribution was revealing. My median response time was 75 seconds. Most of my messages (219) came in the 30-second to 1-minute window. 718 messages happened during evening hours. Zero during the night. This matches my pattern - I queue up work for Claude during the afternoon, then do the bulk of interactive sessions after dinner.

The whole report is [posted on the Adventures in Claude community](https://community.adventuresinclaude.ai/t/claude-code-insights/35/3) with full stats and tables.
