---
title: "Documentation Catches the Second Occurrence. Automation Prevents the Third."
date: 2026-02-18T21:00:00-07:00
description: "I asked Claude Code to review my own usage patterns over the last two months. The retrospective surfaced eight root causes that each appeared three or more times."
draft: false
tags: ["claude-code", "retrospective", "automation", "workflow"]
---

I'm doing 60 days of hyperbaric oxygen chamber therapy and red light therapy to try to address the long Covid thing I've been dealing with for a year and a half. I have no idea if it will be helpful, but even if it's a placebo effect, I'm up for trying.

Each day, I have a 30 minute drive to and from the treatment center. So I've decided to do two random calls a day. I'm calling people I know but haven't talked to much recently. These are random - I just think of someone and call them.

One of today's calls was [Phil Simon](https://www.philsimon.com/). We've known each other for many years and occasionally text and email. We spent 30 minutes geeking out on Claude Code. We each gave each other a few ideas.

One of his was this prompt:

> I have been using Claude Code heavily the last two months. I am curious about what I could do better. Can you provide this report for me?

I typed it in and waited. Claude launched two parallel exploration agents - one to analyze my daily notes and usage patterns, and another to audit my entire configuration setup. Here's what it chewed through:

- 15 daily notes files (2,400 lines of captured insights, gotchas, and learnings)
- 13 global rules files (~44K chars auto-loaded every session)
- Project-level rules, CLAUDE.md files, MEMORY.md
- Skills directory (38 entries, 25 symlinks)
- settings.json (hooks, plugins, permissions)

A few minutes later, I had a full retrospective.

---

The headline number was uncomfortable. Eight root causes appeared three or more times each. My learning capture system - which auto-records insights and gotchas to daily notes files as I work - is good at documenting problems on first occurrence. I created six new rule files from discoveries in February alone. But the prevention loop stalls at automation.

Rules tell Claude what to avoid. They don't stop the underlying system from producing the error.

The top repeaters:

- RLS enabled on database tables without any access policies (4 times). Every query returns empty results with no error. The bug hides for months because admin code bypasses row-level security entirely - it only surfaces when you add user-facing features to a table that previously only had cron job access.
- Vitest mock path mismatches (4 times). When a module moves from a local path to a shared package, every app's test configuration needs a new alias entry. Tests pass locally, fail in CI.
- ALTER ROLE SET replacing instead of appending (3 times, including a production outage on Feb 8 that took down all five apps).
- Pre-commit hook staging unintended file deletions (3 times in one day). This was the most painful - 40 configuration files silently included in a commit because the hook's `git add -u` was scoped too broadly.

---

The configuration audit confirmed what I already knew but hadn't quantified. My auto-loaded context - rule files, project instructions, memory - costs about 19,600 tokens per session before I type anything. I'd already cut it from 28,000 tokens through manual cleanup, but there were still redundancies. The same concept explained in three different files. Fourteen broken skill symlinks pointing to a stale temp directory. I'm constantly adding and cleaning up this content, but the process is entirely manual. It should be automatic.

Feb 8 was the most expensive single day - roughly 50 entries. The PostgREST schema wipe triggered a production outage, and then I discovered 19 database tables with security enabled but zero access policies. That appeared as four separate bug reports before I traced them all to one root cause.

---

The finding I keep coming back to is the gap between documentation and automation. Documentation catches the second occurrence of a problem. Automation prevents the third. Most of my recurring mistakes have rules written about them. The rules work when Claude reads them. But the systems that produce the errors don't read rules.

An RLS audit query that runs on every health check would have caught the missing-policy bug before any user hit it. A vitest alias cross-reference script would flag mismatches when a package adds a new export. A migration linter would reject `ALTER ROLE SET` with a hardcoded string instead of the read-then-append pattern.

I have the documentation layer built. The automation layer is the next step.
