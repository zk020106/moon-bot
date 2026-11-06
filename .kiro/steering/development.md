---
inclusion: auto
name: development-testing
description: Use when installing dependencies, running tests, typecheck, lint, format, eval, or the local web/dev bench for Moon Bot.
---

# Development and testing commands

Commands below are taken from the repository root `package.json` / `AGENTS.md`. Run from the repo root unless noted.

## Setup

```sh
corepack enable && corepack prepare pnpm@10.18.3 --activate
pnpm install
```

## Verify a change (definition of done)

```sh
pnpm test
pnpm run check:static   # typecheck + lint + Biome format:check
```

Related:

```sh
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm run eval           # five-capability offline eval (CI also runs this)
pnpm --filter moon-bot-core run test:related
```

## Local web (not a public demo)

```sh
pnpm --filter moon-bot run web   # default http://127.0.0.1:8290
```

Dev bench with mock model (not an installed-user launch path): `packages/core/dev/bench.sh` — see `AGENTS.md`.

## Hard rules (short)

1. Engines stay behind `AgentRuntime`; host never imports engine internals.
2. No secrets in code, logs, or commits; tests use mock LLM (`packages/core/dev/mock-llm.ts`).
3. Do not commit generated `client.js` / `dist/` outputs.
4. Do not point tests at a real user data directory.
5. Branch/PR: prefer branching from `dev` and opening PRs into `dev` (see `CONTRIBUTING.md` / `AGENTS.md`).

For deeper agent rules, read root `#[[file:AGENTS.md]]` and package-level `AGENTS.md` files under `packages/core` / `apps/desktop` when editing those areas.
