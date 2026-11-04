// Keep moon-bot-core as the pnpm workspace symlink. Packing materializes a copy
// without nested deps; that breaks `pnpm --filter moon-bot run web` (missing fastify).
import { restoreCoreLink } from './before-pack.mjs'

await restoreCoreLink()
