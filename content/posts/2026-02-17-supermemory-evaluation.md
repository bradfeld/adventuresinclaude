---
title: "Evaluating Supermemory for Claude Code"
date: 2026-02-17T10:00:00-07:00
tags: ["memory", "claude-code", "infrastructure", "tools"]
description: "Does a paid memory API add value when you've already built a custom memory system for Claude Code?"
draft: true
---

I found [Supermemory](https://supermemory.ai/) while browsing tool announcements last week. "Universal Memory API for AI apps" - and they have a [Claude Code plugin](https://github.com/supermemoryai/claude-supermemory). My first thought was that this solves a real problem. My second thought was that I've already built a solution to this problem.

So I spent some time figuring out whether Supermemory would add anything to what I already have.

---

Here's what Supermemory does. When you start a Claude Code session, the plugin fetches relevant memories from their API and injects them into context. While you work, it automatically captures your tool usage - edits, file writes, bash commands, task spawns - and stores them as structured memories. You get `super-search` to query past work and `super-save` to manually flag something important.

The interesting bit is what they call "signal extraction." Instead of capturing everything (which would be noisy), you can configure keywords - "remember," "architecture," "decision," "bug" - and it only captures turns that match. The system also maintains separate personal and team memory containers.

It requires a Pro plan at $19/month. The [Claude Code integration docs](https://supermemory.ai/docs/integrations/claude-code) describe the full setup - API key, shell profile changes, per-project config files.

---

My current setup looks different.

I run Claude Code across eight parallel worktrees with a custom memory infrastructure I've built over the past few weeks. The core of it:

- *MEMORY.md* files per project that auto-load into Claude's system prompt at session start. These contain critical lessons, architectural decisions, and patterns. Mine is about 200 lines covering everything from production outage recovery procedures to email formatting preferences.

- *PATTERNS.md* for graduated learnings. When I hit a gotcha - something surprising that could bite me again - it gets captured here with context, problem, and solution. There's a 40-entry cap to keep it useful.

- *Daily notes* captured throughout the day via `/note` commands. These feed into my blog post pipeline - the same pipeline that produced this post. Categories include gotcha, deep-dive, magic-trick, and day-in-life.

- *Skills and rules* - about 30 structured expertise files that teach Claude specific workflows, conventions, and patterns. These live in `~/.claude/skills/` and `~/.claude/rules/`.

- *Session files* that persist workflow state within a ticket lifecycle - what step I'm on, what's been done, what's blocked.

All of it is file-based. All of it is version-controlled. No third-party dependency. The MEMORY.md files are symlinked across all eight worktrees so every Claude session starts with the same institutional knowledge.

---

The comparison comes down to three things.

*Semantic search vs. structured files.* Supermemory offers semantic search across all your memories - you query in natural language and get relevant results. My system uses grep and structured file organization. At the scale I'm operating (a few hundred entries across all memory files), grep works fine. If I had thousands of unstructured memories, semantic search would matter more.

*Automatic capture vs. intentional capture.* Supermemory captures tool usage automatically. My system requires either an explicit `/note` command or relies on Claude proactively suggesting captures based on rules I've defined. The tradeoff is noise vs. quality - automatic capture gets everything but requires filtering. Intentional capture misses some things but what it catches is higher quality.

*Team memory.* This is the one genuine gap. Supermemory maintains separate personal and team memory containers. My current system has no shared memory layer between Claude sessions. When I figure out that `ALTER ROLE SET` replaces instead of appends (which caused a production outage), Daniel's sessions don't automatically learn that. He'd have to read my MEMORY.md or hit the same problem himself.

---

I'm not going to use Supermemory.

The current system works. It's self-contained, it's version-controlled, and it's customized to my workflow. Supermemory solves real problems - context injection, semantic search, and team memory - but I've already solved most of them differently. The one thing I genuinely don't have (shared memory) isn't painful enough to justify adding a vendor dependency and a monthly subscription.

If Supermemory were free and self-hosted, I'd experiment with it. The semantic search layer on top of my existing memories would be interesting. But wrapping my session data through a startup's API - even one that [scored 81.6% on LongMemEval](https://supermemory.ai/blog/we-added-supermemory-to-claude-code-its-insanely-powerful-now/) versus 40-60% for standard RAG - introduces a dependency I don't need for the value it provides.

The takeaway for anyone evaluating this: if you're starting fresh with Claude Code and don't have a memory system yet, Supermemory is a reasonable shortcut. If you've already built something custom, look at what it does that you haven't solved. For me, the answer was team memory - and that wasn't enough.

---

Subscribe via [RSS](https://adventuresinclaude.ai/index.xml) to follow along. The source is always [on GitHub](https://github.com/bradfeld/adventuresinclaude).
