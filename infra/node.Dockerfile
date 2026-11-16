FROM node:22-bookworm-slim AS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile
FROM dependencies AS api
COPY apps/api ./apps/api
RUN pnpm db:generate && pnpm --filter @ami-108/api build && chown -R node:node /app
WORKDIR /app/apps/api
USER node
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]

FROM dependencies AS web
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ami-108/web build && chown -R node:node /app
WORKDIR /app/apps/web
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
