---
inclusion: always
---

# Product overview — Moon Bot

Moon Bot is a **self-hosted team of long-lived AI bots**: you create and manage bots, not disposable chat threads.

## Purpose

- Give each bot a durable identity: name, role, instructions, model, workspace, and long-term memory.
- Use **Chief** (the lilac moon sprite) as a Main Bot that can create other bots, hand them work, and surface results.
- Run without DeepSeek Harness: Fastify web service, built-in agent engine, SQLite storage, optional Electron desktop shell.

## What users do

- Configure an OpenAI-compatible API key (and base URL when needed) in Settings → models/providers.
- Chat with Chief or teammate bots; optionally create bots and assign work through Chief.
- Use themes (Moon, DeepSeek, Claude, Grok), workspace file preview/download, collapsed work-step panels, and OpenUI cards (tables, to-dos, options, forms).

## Sources and license

- Client UI / parts of desktop interaction adapted from DSH Bot / DS Bot under Apache-2.0; runtime and engines are this project’s. See `NOTICE` and `LICENSE` (Apache-2.0).
- Prefer Docker web deploy (`deploy/install.sh`, image `ghcr.io/zk020106/moon-bot`). Desktop packaging is deferred in `README.md`; source remains under `apps/desktop/`.

## Out of scope for agents

- Do not invent metrics, customer claims, or undocumented features.
- Do not commit secrets or point tests at a real `~/.moon-bot` install.
