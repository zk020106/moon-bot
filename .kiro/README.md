# Kiro workspace configuration

This directory holds [Kiro](https://kiro.dev/docs/steering/) **workspace steering** for Moon Bot.

## Provenance

These files were **added in a later PR for ongoing agent-assisted work**. They are not a record of earlier development history, and they do not prove that any past commit was authored with Kiro.

- Steering lives in `.kiro/steering/` (markdown + YAML front matter per current Kiro docs).
- This folder must stay tracked in git (do not add `.kiro/` to `.gitignore`).
- Do not put secrets, API keys, tokens, or machine-local paths here.
- Prefer updating these files when product/stack/layout docs change (`README.md`, `AGENTS.md`, `docs/plans/`).

Foundation files (`product.md`, `tech.md`, `structure.md`) follow Kiro’s recommended project steering set. Extra files use inclusion modes so they load only when relevant.
