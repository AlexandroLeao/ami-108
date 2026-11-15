# Development foundation

## Prerequisites

Node.js 22 (at least 22.12), pnpm 10.15.1 via Corepack, Python 3.12, uv and Docker Compose v2. Codespaces installs the development environment using `.devcontainer/devcontainer.json`. Use a two-core machine if available within your allowance. Keep all forwarded ports private; the foundation is not a production deployment.

## Initial lockfiles (one-time bootstrap)

This draft was authored without registry access. The following commands resolve dependencies in a connected Codespace. Review and commit both lockfiles on this PR branch before merge.

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm db:generate
(cd services/ai && uv lock && uv sync --locked)
git status --short
```

After the lockfiles are committed, use `pnpm install --frozen-lockfile` and `uv sync --locked`. CI and container builds intentionally require them.

## Run checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
(cd services/ai && uv run --locked ruff check . && uv run --locked mypy app tests && uv run --locked pytest)
```

## Start all services

```bash
cp -n .env.example .env
docker compose up --build -d --wait
docker compose ps
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3001/health/ready
curl -fsS http://localhost:8000/health
```

Open private forwarded port 3000 in Codespaces. The temporary screen reports whether the API, database and AI health endpoint are reachable. This is not yet a playable game, and AI health is not evidence of real model inference.

For local Compose, the example values are development-only; replace the password using a URL-safe value (or URL-encode it in the database URL). Never commit `.env`. PostgreSQL is not exposed to the host. The initial migration is applied by the API container on startup.

```bash
docker compose logs --tail=100 api ai web db
docker compose down
```

Stopping preserves the database volume. Do not use `down -v` unless intentionally deleting local game data. Stop the Codespace when finished to conserve quota.

## Current limitations

The initial migration only creates a session identity; authoritative game state is delivered in subsequent issues. No model/provider, game assets, production secrets or cloud services are configured. Package installation, lockfile creation and full runtime checks must pass before this draft is eligible for merge.
