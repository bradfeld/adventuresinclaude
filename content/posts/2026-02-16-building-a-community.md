---
title: "Building a Community"
date: 2026-02-16T20:00:00-07:00
tags: ["community", "discourse", "infrastructure"]
description: "From solo dev diary to invite-only community for retired entrepreneurs and coders building with AI"
draft: false
---

I've been writing Adventures in Claude as a solo dev diary — documenting what it's like to build real software with Claude Code as your primary collaborator. But the most interesting conversations about this stuff have been happening in DMs, email threads, and random encounters with other people doing the same thing.

So I built a community.

---

## What It Is

[Adventures in Claude Community](https://community.adventuresinclaude.ai) is an invite-only forum for retired entrepreneurs and coders who are actively experimenting with Claude. It runs on self-hosted Discourse on a DigitalOcean droplet, which means you can participate through the web or entirely through email — reply to notification emails to post, or enable mailing list mode to get every message in your inbox.

## Why Discourse

I wanted something that felt like the old-school mailing lists and forums that worked so well for technical communities. Discourse gives you that with modern tooling:

- **Email participation** — you never have to visit a website if you don't want to
- **Mailing list mode** — every post lands in your inbox, reply to participate
- **Categories** — Introductions, Projects, Tips & Techniques, Discussion
- **Self-hosted** — we own the data, no algorithmic feed, no ads

## How I Built It

The entire infrastructure was set up in a single session with Claude Code:

- **DigitalOcean droplet** with Discourse Docker
- **Let's Encrypt** TLS certificates
- **Resend** for outbound email (SMTP) and inbound email (webhook bridge)
- **BetterStack** for uptime monitoring
- **Automated backups** — daily Discourse backups plus weekly config snapshots

The most interesting piece was the inbound email pipeline. Resend's webhook sends metadata only — no email body. So I wrote a Python bridge service that receives the webhook, fetches the raw email from Resend's API, and forwards it to Discourse's `handle_mail` endpoint. It runs as a systemd service on the host, proxied through nginx inside the Discourse container.

## Join

The community is invite-only. If you're a retired entrepreneur or coder who's actively experimenting with Claude, [email me](mailto:brad@intensitymagic.com) to request an invite. Tell me a bit about what you're building or exploring.

You can also visit the [Community page](/community/) for more details.
