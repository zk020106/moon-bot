---
inclusion: always
---

# Technology stack — Moon Bot

## Runtime and tooling

- **Node.js** ≥ 22.18; **pnpm** ≥ 10.18.3 via Corepack (`packageManager` in root `package.json`, currently `pnpm@10.18.3`).
- Monorepo: `pnpm-workspace.yaml` with `apps/*` and `packages/*`.
- TypeScript throughout; Biome for format; oxlint + custom gates for lint/architecture.

## Packages

| Package | Role |
| --- | --- |
| `packages/core` (`moon-bot-core`) | Product: Fastify service, host services, SQLite store, `AgentRuntime` engines, React client |
| `packages/contracts` (`moon-bot-contracts`) | Shared schemas/RPC/views catalogs (no React/Fastify/SQLite) |
| `packages/ui` (`moon-bot-ui`) | Shared React kit primitives |
| `apps/desktop` (`moon-bot`) | Electron shell + `pnpm --filter moon-bot run web` |
| `apps/connect` (`moon-bot-connect`) | CLI to attach a local ACP agent to a remote relay |

## Engines and integrations

- Built-in engine: `@earendil-works/pi-agent-core` + `pi-ai` behind `AgentRuntime`.
- Also: ACP adapters / vendor app-server clients behind the same seam — host code must not import engine internals.
- Models: OpenAI-compatible providers configured in Settings (or env; see `deploy/.env.example`).
- MCP connectors are product features; do not commit connector secrets into the repo.

## Generated artifacts (never commit)

Built by root `postinstall` / `pnpm run build`: `packages/core/client.js`, `packages/core/dist/`, `packages/contracts/dist/`, `packages/ui/dist/`, desktop UI/main pack outputs (see `.gitignore`).
