# Security Policy

## Supported versions

Security fixes land on the `main` branch and are published as new Docker image tags (`ghcr.io/zk020106/moon-bot`). There is no long-term support branch yet — upgrade to the latest `main` / `latest` image when a fix ships.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a security problem.

- Prefer [GitHub private vulnerability reporting](https://github.com/zk020106/moon-bot/security/advisories/new) on this repository.
- Or email the maintainer at the address listed on the [zk020106 GitHub profile](https://github.com/zk020106).

Include steps to reproduce, affected version or image tag, and impact. We will acknowledge the report and work on a fix before any public disclosure.

## Scope notes

Moon Bot is self-hosted. Keep `MOON_BOT_PASSWORD`, model API keys, and the `deploy/` data volume private. The web UI must not be exposed without a password when bound outside loopback.
