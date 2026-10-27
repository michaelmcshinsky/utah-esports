# Utah Esports discord bot — Coolify / Docker
# Build context: repo root (pnpm monorepo).
# Long-running WebSocket process — never deploy to serverless.
FROM node:22-alpine
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
WORKDIR /repo/apps/discord-bot
# Register slash commands once per release if needed:
#   pnpm register-commands
CMD ["pnpm", "start"]
