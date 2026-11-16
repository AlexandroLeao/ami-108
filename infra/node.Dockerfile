FROM node:22-bookworm-slim AS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Enable Corepack as root, then create the workspace with its final ownership.
# Installing and building as node avoids a recursive chown layer that duplicates
# the dependency tree in overlay storage on constrained development VMs.
RUN corepack enable && mkdir -p /app && chown node:node /app
WORKDIR /app
COPY --chown=node:node package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=node:node apps/web/package.json apps/web/package.json
COPY --chown=node:node apps/api/package.json apps/api/package.json
USER node
RUN pnpm install --frozen-lockfile

FROM dependencies AS api
COPY --chown=node:node apps/api ./apps/api
RUN pnpm db:generate && pnpm --filter @ami-108/api build
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]

FROM dependencies AS web
COPY --chown=node:node apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @ami-108/web build
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
