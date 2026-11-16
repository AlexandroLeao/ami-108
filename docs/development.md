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

In Google Cloud Shell, use Web Preview on port 3000 (not 3001). In Codespaces, open private forwarded port 3000. Local Compose sets AMI_DEV_PREVIEW=1, so the root opens the integrated Chapter 1 game with server-controlled progress. `/preview` retains the isolated visual fixture. Health endpoints remain available; without the flag, the root is diagnostic. AI health is not evidence of real model inference. See [asset preview and disk recovery](assets.md).

For local Compose, the example values are development-only; replace the password using a URL-safe value (or URL-encode it in the database URL). Never commit `.env`. PostgreSQL is not exposed to the host. Prisma migrations are applied by the API container on startup; the new migration is additive and preserves existing rows.

```bash
docker compose logs --tail=100 api ai web db
docker compose stop
```

Before stopping, check `git status --short`; stop the containers, switch to main only if the worktree is clean, and pull with `git pull --ff-only origin main`. Resume using `docker compose up -d --wait` if the current containers match the checked-out code; rebuild sequentially after source changes or VM replacement. Stopping preserves the database volume. Do not use `down -v` unless intentionally deleting local game data. Stop the development session when finished to conserve quota. Cloud Shell is temporary; do not rely on Docker volumes surviving VM replacement.

### Safe Cloud Shell shutdown and local database backup

If preserving local playtest data, export the running PostgreSQL database before stopping services. The dump contains private game state and session digests; keep it outside the repository, with restrictive permissions. Do not overwrite a known-good backup with a failed dump.

```bash
mkdir -p ~/ami-108-backups
chmod 700 ~/ami-108-backups
(
  umask 077
  backup="$HOME/ami-108-backups/chapter1-$(date +%Y%m%d-%H%M%S).sql"
  if docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$backup.tmp" && test -s "$backup.tmp"; then
    mv "$backup.tmp" "$backup"
    printf 'Backup saved: %s\n' "$backup"
  else
    rm -f "$backup.tmp"
    exit 1
  fi
)
```

Verify the backup command succeeds before stopping. Then use `docker compose stop`, `docker compose ps -a` (all project services should be stopped), and `exit`. Close the private web preview. The Docker volume may disappear when Cloud Shell replaces the VM; normal persistent home storage is preferable to the ephemeral VM, but is not a substitute for an independent backup. A database dump alone does not restore a browser cookie or guarantee resume on a different origin. Never commit the dump or credentials. No production or paid resources are required.

## Chapter 1 integration checks

CI uses an ephemeral PostgreSQL 17 service, applies both migrations, runs API integration tests and starts the built Next.js/NestJS applications for an HTTP smoke test. `AMI_TEST_DATABASE_URL` opts into real database tests; use a dedicated disposable database, not player data. The smoke test needs DATABASE_URL and a migrated database, and ports 3000/3001 free. No provider inference or real deployment is involved.

For Chapter 1 validation after PR #20, switch to `main` on a clean worktree, pull with `git pull --ff-only origin main`, ensure `.env` exists, then run `docker compose --parallel 1 up --build -d --wait`. Open port 3000 root (not `/preview`), test the complete first chapter, reload/Continue game, language switching, previous/next, art, the HUD and mobile long-text pages. Use the same browser and origin; an expired cookie or a replaced Cloud Shell VM can prevent resume. Do not delete volumes. See [narrative engine](narrative-engine.md).

## Current limitations

Chapter 1 sessions, state and command receipts are persisted; the remaining encounters, snapshots, consultation slots, restorations and real inference are not implemented in this increment. All 12 derived assets remain on the API side. Only the current authorized scene is served by the game API; the isolated preview still serves CENA-01 alone. No model/provider, production secrets or cloud services are configured. Codespaces startup is not verified; Google Cloud Shell was used instead.

## Day 1 UI verification (2026-11-16)

- PR #18 merged at `3e7eda0`; final head `6f0c778` passed [CI 43899909994](https://github.com/AlexandroLeao/ami-108/actions/runs/43899909994). Owner approved final preview on desktop and mobile.
- The Dockerfile installs and builds as node, without recursively changing ownership of dependency trees. See disk-space recovery in assets.md. No paid compute required.
- PR #19 merged the pure narrative core at `5fa75b6`. PR #20 merged the owner-approved persisted Chapter 1 campaign at `3cf942a`; [final branch CI 43934104792](https://github.com/AlexandroLeao/ami-108/actions/runs/43934104792) and [post-merge CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passed. The final branch ran 24 API, 17 web and 1 Python test (42 total); Python emitted one non-blocking warning. Both stacks, migrations and built HTTP smoke passed. Owner acceptance is not an independent browser automation or full accessibility audit.

## Bootstrap verification (2026-11-15)

- Lockfiles committed in `9142928`.
- [CI run 43763764606](https://github.com/AlexandroLeao/ami-108/actions/runs/43763764606): TypeScript and Python jobs passed (frozen installs, Prisma generation, lint, type checks, tests and builds as applicable).
- Owner ran Docker Compose in Google Cloud Shell: all four containers healthy; web and AI liveness returned HTTP 200, API readiness returned database and AI status `ok`.
- Owner confirmed the Next.js development screen in Web Preview on port 3000, displaying `API, database and AI service reachable.`
- These are development integration checks, not evidence of game completion, real inference, production deployment or Codespaces validation.
