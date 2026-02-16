---
title: "Reading List"
ShowReadingTime: false
ShowBreadCrumbs: true
searchHidden: true
---

A curated collection of resources for AI-assisted development. These are the docs, tools, and ideas I keep coming back to while building with Claude Code.

## Getting Started with Claude Code

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) — The official reference. Start here for installation, configuration, and core concepts.
- [Claude Model Card](https://docs.anthropic.com/en/docs/about-claude/models) — Model capabilities, context windows, and which model to use when
- [Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — How to write prompts that get better results. Applies to Claude Code commands, skills, and agent definitions.

## Building Agents & Workflows

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic's research on agentic AI patterns. The foundation for skills, chains, and multi-agent workflows.
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) — Practical examples and guides. Useful for understanding tool use, structured output, and API patterns.
- [Claude Code on GitHub](https://github.com/anthropics/claude-code) — The CLI tool's source code. Read the issues and discussions for real-world usage patterns.

## The Stack

The tools I use daily, and why:

- [Supabase](https://supabase.com/) — PostgreSQL with Row Level Security, Auth, and Edge Functions. The database layer for the entire Magic Platform.
- [Vercel](https://vercel.com/) — Three-tier deployment pipeline (feature branches → staging → production). Preview deployments for every push.
- [Linear](https://linear.app/) — Project management via MCP integration. Every `/start` and `/commit` talks to Linear automatically.
- [Hugo](https://gohugo.io/) — Static site generator powering this blog. Fast builds, markdown-native, good theme ecosystem.
- [PaperMod](https://github.com/adityatelange/hugo-PaperMod) — The Hugo theme this site runs on. Clean, fast, good search support.

## Open Source

Projects from the blog that you can explore:

- [Adventures in Claude](https://github.com/bradfeld/adventuresinclaude) — This site's source code. Hugo + PaperMod + Vercel auto-deploy.
- [Freshell](https://github.com/bradfeld/freshell) — Terminal multiplexer built with Claude Code. Fork of a Rust project, contributed upstream.

## Perspectives

Writing that shaped how I think about AI-assisted development:

- [The End of Programming as We Know It](https://www.oreilly.com/radar/the-end-of-programming-as-we-know-it/) — Tim O'Reilly on AI's impact on software development
- [AI-Native Development](https://blog.pragmaticengineer.com/ai-tooling-for-software-engineers/) — The Pragmatic Engineer on AI tools for developers
- [llms.txt Standard](https://llmstxt.org/) — Making websites AI-readable. A small spec with big implications for how AI agents interact with the web.

---

*This page is updated periodically. Have a suggestion? [Open an issue](https://github.com/bradfeld/adventuresinclaude/issues).*
