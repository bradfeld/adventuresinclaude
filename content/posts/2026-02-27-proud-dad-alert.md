---
title: "Proud Dad Alert"
date: 2026-02-27T07:45:00-07:00
description: "My niece Sabrina built a custom portfolio site using Claude Code. She's a product designer, not a developer, and she shipped it in about six hours of active work."
draft: true
tags: ["claude-code", "family", "vibe-coding"]
---

My brother Daniel sent an email to the family last Wednesday with the subject line "Proud Dad alert!" His daughter [Sabrina](https://sabrinafeld.com) had just built and launched a portfolio website from scratch. She didn't use Squarespace or Wix. She built a custom [Next.js](https://nextjs.org/) site with scroll-triggered animations, a frosted glass navigation header, a custom image carousel with lightbox, and six page templates - all self-hosted on [Netlify](https://www.netlify.com/).

Sabrina is a senior at [Scripps College](https://www.scrippscollege.edu/) pursuing dual degrees in Science, Technology & Society and Fine Arts. She's a product designer and fine artist - not a software developer. She built the entire thing using [Claude Code](https://claude.ai/claude-code).

---

She wrote a [blog post about the process](https://sabrinafeld.com/projects/building-this-website/) that describes what it's like to direct an AI when you don't know CSS. She "had to get precise in other ways" - using design vocabulary and visual references instead of code snippets. When bugs appeared, she described symptoms and shared screenshots rather than reading stack traces.

The line that stuck with me: "Vague prompts produced generic designs. Clear creative conviction produced something that felt like mine."

This matches what I see building with Claude Code every day. The quality of the output tracks directly with the specificity of the input. "Make this look better" gives you something generic. "I want warm tones, editorial layout, and a buttercup accent color for hover states" gives you something that looks like a real design decision was made. Sabrina's version of this was arriving at each session with strong opinions about what she wanted - gathered design references, prepared content, and a clear vision for the aesthetic.

She did over twenty feedback sessions across an eleven-day build, with about four to six hours of active work. The AI didn't eliminate iteration. It made each round faster.

---

Go look at [the site](https://sabrinafeld.com). Her art section showcases monotype, pastel, watercolor, and cyanotype work. The projects section covers her product management work at [StackHawk](https://www.stackhawk.com/) - including a product launch she led end-to-end and research for an AI-driven security testing tool. The design is clean and typography-focused, with a dark footer and those buttercup accent colors she specified.

After I saw the site, I did what any uncle who spends his days building web apps would do - I ran a security review. The results were solid. TLS configuration is correct, no sensitive files exposed, no source maps in production, HTTP redirects to HTTPS properly. I sent Sabrina a list of security headers to add and some DNS records worth configuring - about ten minutes of work that addresses half the findings.

---

The thing I keep coming back to is her observation that the AI "doesn't eliminate iteration - it makes each iteration faster." She still did dozens of rounds of refinement. She still had to debug across different devices and screen sizes. She still made every creative decision herself. The AI handled the translation from "I want this" to working code, but the "I want this" part required genuine creative conviction.

Sabrina is looking for roles in product design and product management after graduation this spring. Her portfolio is at [sabrinafeld.com](https://sabrinafeld.com).
