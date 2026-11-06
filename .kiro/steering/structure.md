---
inclusion: always
---

# Project structure — Moon Bot

## Layout

```
apps/desktop/     # Electron app + web entry (`pnpm --filter moon-bot run web`)
apps/connect/     # moon-bot-connect CLI
packages/core/    # host, engine, store, service, client
packages/contracts/
packages/ui/
deploy/           # Docker/web install scripts
docs/             # vision, plans (Chinese), releasing
```

Useful entry points (see also root `AGENTS.md`):

- `packages/core/src/host/` — roster, tools, turns, groups, memory, schedules, capabilities
- `packages/core/src/engine/` — `AgentRuntime`, builtin/ACP implementations
- `packages/core/src/store/` — SQLite
- `packages/core/src/service/` — Fastify assembly
- `packages/core/src/client/` — React UI
- `docs/plans/` — decided designs (Chinese); read before changing behavior

## Naming and imports

- Prefer workspace package barrels: `moon-bot-contracts`, `moon-bot-ui` (named exports).
- Host must not call engine internals; engines expose only `AgentRuntime` methods.
- Follow surrounding code style; keep functions small; comment only non-obvious constraints.

## Data directories

- User/runtime data: `~/.moon-bot` (or image `/data`) — never use for tests.
- Tests and benches use temporary / mock directories and tear them down.
