# Utah Esports discord bot — Coolify / Docker
# Build context: repo root (pnpm monorepo).
# Long-running WebSocket process — never deploy to serverless.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/discord-bot/package.json apps/discord-bot/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter @utah-esports/discord-bot...

FROM deps AS runtime
COPY . .
WORKDIR /repo/apps/discord-bot
ENV NODE_ENV=production
# Register slash commands once per release if needed:
#   pnpm --filter @utah-esports/discord-bot register-commands
CMD ["pnpm", "start"]
