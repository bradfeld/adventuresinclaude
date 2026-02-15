---
title: "Building This Site with Claude Code"
date: 2026-02-14T18:00:00-07:00
tags: ["claude-code", "hugo", "meta", "workflow"]
description: "How Claude Code and I built adventuresinclaude.ai in a single conversation - from brainstorming to live site"
draft: true
---

[Michael Natkin](https://www.herbivoracious.com) texted me this morning. He'd seen my [post about using Claude to update WordPress](https://feld.com/archives/2026/02/claude-code-now-posts-to-this-blog/) and told me he'd just had Claude move his entire food blog off WordPress onto a Hugo static site hosted on GitHub Pages. "Literally just plan mode and say 'get me off WordPress and onto a Hugo static site,'" he said. "And the new site is insanely fast."

I wasn't ready to move [feld.com](https://feld.com) off WordPress. But the idea stuck.

---

I'd been writing about Claude Code and AI development on feld.com for the past few weeks. Four of my last five posts were about this stuff - [CEOS](https://feld.com/archives/2026/02/streamline-workflow-with-ceos-claude-meets-eos/), [Freshell](https://feld.com/archives/2026/02/freshell-contributing-to-open-source/), [Claude posting to WordPress](https://feld.com/archives/2026/02/claude-code-now-posts-to-this-blog/), [what I'm obsessed with](https://feld.com/archives/2026/02/tech-im-obsessed-with/). The Claude content had taken over. It deserved its own home.

I already owned [adventuresinclaude.ai](https://adventuresinclaude.ai) and [adventuresinclaude.com](https://adventuresinclaude.com). Time to use them.

---

I started a Claude Code session and told it what I wanted. Not "build me a Hugo site" - I genuinely didn't know if Hugo was the right choice. I said I wanted to explore it, brainstorm, and figure out if this was a good approach.

What followed was a design conversation. Claude asked me questions one at a time - what features did I need, how did I want to handle email subscriptions, where should it be hosted, what theme. Each question had options with tradeoffs. I picked, it moved to the next question.

The whole brainstorm took maybe 20 minutes. Here's what we landed on:

- *Hugo with PaperMod theme* - fast, markdown-native, minimal. I can swap themes later since content is just markdown files.
- *Vercel for hosting* - my domains were already there. Push to main, site deploys in 30 seconds.
- *Kit (ConvertKit) for email* - free up to 10,000 subscribers, watches the RSS feed and auto-sends. I looked at Buttondown ($79 for 10K users), Substack (platform lock-in - you're publishing in two places), and Mailchimp (gutted free tier). Kit was the clear winner.
- *Vercel Analytics* - zero setup, already included.
- *Social posting deferred to Phase 2* - X and LinkedIn APIs can wait. Ship the site first.

The key design insight was that I didn't need a new content pipeline. I already had one. The `/note` command captures insights throughout the day. The `/blog-draft` command aggregates those notes into a structured post. All we needed to do was retarget the output from my IntensityMagic blog to the Hugo repo. Same capture, same aggregation, different destination.

---

After the brainstorm, Claude wrote a design document and then an implementation plan. Eleven tasks. It executed them in sequence - installing Hugo, creating the GitHub repo, initializing the site, configuring PaperMod, creating content pages, deploying to Vercel, wiring up the domains, writing a `/blog-publish` command, retargeting `/blog-draft`, and creating the repo documentation.

I didn't write any of the code. Claude did all of it. I approved the design decisions and watched it work.

One thing went wrong during the build - Hugo v0.155 had deprecated the `paginate` config key in favor of `pagination.pagerSize`. Claude caught the error, fixed the config, and moved on. It also hit a `master` vs `main` branch mismatch - Hugo scaffolds with `master` but GitHub defaults to `main`. Another quick fix.

The whole thing - from "tell me about Hugo" to a live site with a published post - happened in a single conversation.

---

The repo is public at [github.com/bradfeld/adventuresinclaude](https://github.com/bradfeld/adventuresinclaude). The entire thing is markdown files, a TOML config, and a theme pulled in as a git submodule. No Node.js. No build dependencies beyond Hugo itself. The build takes 36 milliseconds.

Here's what the publishing workflow looks like now:

- Throughout the day, `/note` captures things I learn or discover - and Claude automatically logs its own insight blocks to the same daily notes file as it works
- At the end of the day (or whenever), `/blog-draft` aggregates those notes into a post
- I edit the draft
- `/blog-publish` commits it, pushes to GitHub, Vercel auto-deploys, Kit emails subscribers

One command to capture. One command to aggregate. One command to ship. Everything else is automatic.

---

The thing that struck me most about this process wasn't the speed - though going from zero to a live blog in one session is genuinely fast. It was the quality of the brainstorming. Claude didn't just say "use Hugo." It asked what mattered to me, presented options with real tradeoffs, made recommendations with reasoning, and built a design that integrated with my existing tools.

Subscribe via [RSS](/index.xml) to follow along. The source is always [on GitHub](https://github.com/bradfeld/adventuresinclaude).
