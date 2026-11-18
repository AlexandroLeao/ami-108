# Development foundation

## Day 3 pause and resume — November 18, 2026

Accepted main `d587be9` (PR #24) is now installed in the owner's Cloud Shell: backup checksum and full archive read succeeded, fast-forward and build succeeded, all four migrations current, all four services healthy, original session count 1. Owner confirmed Continue resumed the original game. Real-model browser preview audit: 13/14 validated, one timeout safely fell back, all eight desktop/mobile checks passed. Production/local port 3000 is explicitly fallback-only for now; Ollama was used only in the isolated tests and preview. Do not confuse AI service health with active model inference.

**Pause procedure:** close game tabs, confirm clean main, stop web/API to quiesce writes, save a new custom-format database dump in private persistent home, check nonempty, pg_restore list and full archive read, record SHA-256, then stop the remaining services. Preserve `.env`, cookie, origin and volumes; do not run down -v, delete volumes, prune or clear browser site data. Keep a private independent copy of the latest dump. If any step fails, do not remove containers/volumes or overwrite known-good backups; DB can remain running for recovery. Actual shutdown and new post-migration dump remain owner-run.

**Resume:** check git status, current main and `.env` existence without printing secrets. Rebuild/start with generation explicitly disabled first; inspect migrations and session count. If volume was replaced and DB is empty, stop before beginning a new game and restore only after verifying the latest archive and recovery plan; never restore over a nonempty DB blindly. Use same browser/origin; database dump cannot restore a lost session cookie. Verify Continue before any AI activation. The main local provider activation is a separate task: install pinned Ollama/model on an internal network, use a private internal token, no published model port, no cloud inference, warm model and test only fresh eligible slots; existing cached slots must not reroll. No paid resources or production deployment.

**Development handoff:** #24 merged, #9/#10 closed, #8 open for F3/CP-BOAR. Documentation PR #27 and draft #28 (Chapter 4 server-only catalog/tests, CI 44318687531 passed at `6055e39`) remain separate. Next implement gated F3 and manual/memory sequence, replay and original asset authorization; then Chapter 5 and QA. No new campaign work merged or deployed. Private Master v1.13 and Script v1.11 remain authoritative; do not edit approved art/dialogue.

## Historical safe stop and restart — November 17

Cloud Shell transcript confirms successful fast-forward to `985cb60`, successful Compose build, four healthy services. Earlier resource check: 15 GiB RAM, 12 GiB available, 27 GB available ephemeral root, 1.7 GB available persistent /home. Observations, not a guarantee of later VM resources or model suitability. Do not install/pull a model yet. Close game tabs, back up PostgreSQL to private persistent $HOME outside Git, then stop containers only after a successful nonempty verified dump. Optionally download privately. Do not run `down -v`, `volume rm`, or prune volumes. Docker volume is VM-local; use same browser/origin/cookie. Dump cannot restore lost cookie. On return check git status, pull main with --ff-only, rebuild if necessary. If a new empty database volume appears, stop and recover from verified dump; never overwrite a nonempty DB blindly. See historical shutdown procedure below.

**Current accepted baseline — November 17, 2026:** PR #25 merged at `985cb60` (approved head `b80b450`); [branch CI 44186325324](https://github.com/AlexandroLeao/ami-108/actions/runs/44186325324) and [main CI 44187359246](https://github.com/AlexandroLeao/ami-108/actions/runs/44187359246) passed 85 tests (67 API, 17 web, 1 Python), lint/types/build, three migrations and HTTP smoke through the Chapter 4 card. Owner approved desktop/mobile and PT-BR/EN. Chapters 1–3 playable with authored fallback; Chapter 4 is the current boundary. All twelve original artwork files and manifest match the prior baseline. Current acceptance supersedes earlier chronological notes, including solar and delayed creature reveal. Private Master v1.12 / Script v1.10 remain the last synchronized private versions; owner-approved PR #25 amendments take precedence and are pending private-source synchronization.

---


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

In Google Cloud Shell, use Web Preview on port 3000 (not 3001). In Codespaces, open private forwarded port 3000. Local Compose sets AMI_DEV_PREVIEW=1, so the root opens the integrated Chapters 1–2 game with server-controlled progress. `/preview` retains the isolated visual fixture. Health endpoints remain available; without the flag, the root is diagnostic. AI health is not evidence of real model inference. See [asset preview and disk recovery](assets.md).

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
  backup="$HOME/ami-108-backups/chapter2-$(date +%Y%m%d-%H%M%S).sql"
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

CI uses an ephemeral PostgreSQL 17 service, applies all three migrations, runs API integration tests and starts the built Next.js/NestJS applications for an HTTP smoke test. `AMI_TEST_DATABASE_URL` opts into real database tests; use a dedicated disposable database, not player data. The smoke test needs DATABASE_URL and a migrated database, and ports 3000/3001 free. No provider inference or real deployment is involved.

For Chapter 1 validation after PR #20, switch to `main` on a clean worktree, pull with `git pull --ff-only origin main`, ensure `.env` exists, then run `docker compose --parallel 1 up --build -d --wait`. Open port 3000 root (not `/preview`), test the complete first chapter, reload/Continue game, language switching, previous/next, art, the HUD and mobile long-text pages. Use the same browser and origin; an expired cookie or a replaced Cloud Shell VM can prevent resume. Do not delete volumes. See [narrative engine](narrative-engine.md).

## Current limitations

Chapters 1–2 sessions, state and command receipts are persisted, including CP-DOG, resolved consultation slots, F1 and SOL-01. Later encounters/checkpoints/slots, F2/F3, SOL-02 and real inference remain unimplemented. All 12 derived assets remain on the API side. Only the current authorized scene is served by the game API; the isolated preview still serves CENA-01 alone. No model/provider, production secrets or cloud services are configured. Codespaces startup is not verified; Google Cloud Shell was used instead.

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

## Chapter 2 accepted playtest (PR #22)

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

The following records the historical playtest procedure and acceptance checks; the current stable branch is `main`.

After the candidate CI passes, switch to `feat/dog-encounter` with a clean worktree, pull, and rebuild sequentially. A third additive migration creates CP-DOG and resolved slot tables; the prior Chapter 1 session/version remains compatible. Use private Web Preview on port 3000, not `/preview`. Resume the Chapter 2 card if available; otherwise play from a new run only after protecting any existing resume target. Verify direct choice, all three death/return paths, three consultation debits and cached reuse, no consult at zero, F1 without recharge, independent SOL-01, MEM-D2, E-NAME, both locales and reload. Do not expose safe-choice IDs in player-facing UI. Back up local player data before switching branches; do not delete volumes. Owner confirmed PT-BR, EN and mobile playtests; independent automated browser/accessibility verification remains AMI-010.

Owner refinement: test Continue → Continue where you left off / Chapters; only reached chapters appear. Restart Chapter 1, then Chapter 2, then Chapter 3 if reached, verify high-water access, exact restored entry state, persisted slot reuse and reload. Also check the stable header Menu during navigation, three red information cards, dark dog approach, one-shot reveal, no backward action at the decision, no clipped choices at standard portrait/landscape, skull death card and dark success branch. Keep existing volumes; no schema migration beyond the earlier CP-DOG/slot migration.

Second refinement checks: all three dog success variants converge on dark arrival narration, then CENA-05; check red skull, energy bars without fraction, three information cards and retired tutorial compatibility, MEM-D2 closure/black beats/wake, delayed DAVID label and exactly-once E-NAME. No change to existing migration or save format version.

Third refinement checks: main Continue and submenu Continue game / Chapters, number-only chapter buttons, centered larger energy bars without visible memory metrics, terminal search narration and single loaded-art fade-in on FOUND, unchanged L01, revised cake-related dialogue, two dark familiar-voice beats, brief text tremor on MEM-D2. Verify F1 does not recharge and SOL-01 still restores three bars exactly once. No new migrations or assets.

Fourth refinement checks: verify the terminal wording, continuous subtle tremor only on FB-D1b–g, MEM-D2/F01/F01b and one-shot ??? → DAVID on L18c (reduced motion supported). Check that CENA-04 dialogue and choice geometry matches the pre-fourth-refinement layout, all choices visible and original CENA-05 stable across adjacent beats. Smoke now checks all 12 disk asset hashes and all illustrated HTTP beats through Chapter 2 against the manifest. No new asset or migration.

Owner correction checks: compare the normal CENA-04 dialogue frame and decision screen with b9da1be; the added dog-wide sizing rule and marker are removed. All three success branches use the same L04 text in PT-BR/EN, and the one-shot name crossfade lasts 1800ms. Preserve the scoped continuous memory motion and asset hash smoke.

## Resume after Day 2

After the verified database backup and stop procedure above, reopen Cloud Shell, `cd ~/ami-108`, check `git status`, switch to `main`, `git pull --ff-only origin main`, then `docker compose --parallel 1 up --build -d --wait` and `docker compose ps`. Use the same private port 3000 preview and browser/origin when possible. A changed VM/volume or expired cookie may require recovery; do not promise resume from a dump alone. Keep private documents and dumps outside Git. New AMI-007/008 work begins on a separate branch after verifying the stable baseline.


## Resume verification — November 18 (later session)

Cloud Shell replaced the ephemeral VM (Docker initially empty). Owner restored checksum-verified `day3-final-20261118-140919.dump` into a newly created empty PostgreSQL volume; custom archive full read and single-transaction restore succeeded. Rebuild at `d587be9` succeeded, four migrations current, four services healthy, one original session retained; owner confirmed Continue in port 3000. No repeat restore. New VM: 7.8 GiB total RAM, 4.7 GiB available after startup, 27 GB root free, 1.7 GB persistent home free. Generation still disabled. Re-evaluate the pinned warmed provider in isolation under current resource constraints before live opt-in. Prior benchmark script hardcodes historical pre-merge `af212f0`; adapt only the temporary script guard to `d587be9` and bound the experimental Ollama container to 3 GiB. Do not change deadlines, main runtime or player database. Previous real model performance does not establish performance on this VM.
