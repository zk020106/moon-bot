# moon-bot-core

Runtime for [Moon Bot](https://github.com/zk020106/moon-bot): Fastify service, SQLite store, built-in agent engines, and the Bot team host.

This package is the `moon-bot-core` workspace member. End users should install the **web image** or run the app from the repository root — see the [root README](../../README.md). Contributors: `pnpm install` at the repo root, then `pnpm --filter moon-bot-core test`.

## What it provides

- HTTP/WebSocket service (`moon-bot-core/service`) for the web and desktop shells
- Bot roster, chats, memory, tools, and OpenAI-compatible model providers
- Client UI bundle entry (`moon-bot-core/client`) used by `apps/desktop`

## Engines

Requires **Node.js ≥ 22.18** (same as the repo root `engines`).

## License

Apache-2.0. Forked and heavily adapted from [DS Bot](https://github.com/Fei2411/DeepSeek-Bot) (Apache-2.0); see the repository [NOTICE](../../NOTICE).
