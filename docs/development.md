# Development foundation

## Prerequisites

Node.js 22 (at least 22.12), pnpm 10.15.1 via Corepack, Python 3.12, uv and Docker Compose (the Docker CLI plugin). Google Cloud Shell is the verified manual development environment. Codespaces remains an optional alternative using `.devcontainer/devcontainer.json`; its startup has not been verified. Use a two-core Codespace only if available within your allowance. Keep previews private; this is not a production deployment.

### Google Cloud Shell

From a clone of the repository, use `nvm install 22`, `nvm use 22` and `corepack enable pnpm`. Confirm `node --version`, `pnpm --version`, `python3 --version`, `uv --version` and `docker compose version`. Check free disk space with `df -h / /home` and `docker system df`. Home storage is limited; use CI for heavy dependency checks when practical. No Google Cloud or AWS billable resources are required.

## Install dependencies

Both lockfiles are committed. Use frozen/locked installs. Local installation is optional when relying on CI and container builds.

```bash
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm db:generate
(cd services/ai && uv sync --locked)
```

Regenerate lockfiles only when changing dependencies. CI and container builds intentionally require the committed lockfiles.

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
test -f .env || cp .env.example .env
docker compose --parallel 1 up --build -d --wait
docker compose ps
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3001/health/ready
curl -fsS http://localhost:8000/health
```

In Google Cloud Shell, use Web Preview on port 3000 (not 3001). In Codespaces, open private forwarded port 3000. The temporary screen reports whether the API, database and AI health endpoint are reachable. This is not yet a playable game, and AI health is not evidence of real model inference.

For local Compose, the example values are development-only; replace the password using a URL-safe value (or URL-encode it in the database URL). Never commit `.env`. PostgreSQL is not exposed to the host. The initial migration is applied by the API container on startup.

```bash
docker compose logs --tail=100 api ai web db
docker compose down
```

Stopping preserves the database volume. Do not use `down -v` unless intentionally deleting local game data. Stop the development session when finished to conserve quota. Cloud Shell is temporary; do not rely on Docker volumes surviving VM replacement.

## Current limitations

The initial migration only creates a session identity; authoritative game state is delivered in subsequent issues. No model/provider, game assets, production secrets or cloud services are configured. Codespaces startup is not verified; Google Cloud Shell was used instead.

## Bootstrap verification (2026-11-15)

- Lockfiles committed in `9142928`.
- [CI run 43763764606](https://github.com/AlexandroLeao/ami-108/actions/runs/43763764606): TypeScript and Python jobs passed (frozen installs, Prisma generation, lint, type checks, tests and builds as applicable).
- Owner ran Docker Compose in Google Cloud Shell: all four containers healthy; web and AI liveness returned HTTP 200, API readiness returned database and AI status `ok`.
- Owner confirmed the Next.js development screen in Web Preview on port 3000, displaying `API, database and AI service reachable.`
- These are development integration checks, not evidence of game completion, real inference, production deployment or Codespaces validation.
