# Vercel Services — pre-deployment gate

**State (November 20, 2026):** Vercel Hobby and Neon Free configured. [Owner-dispatched Neon preview migration #1](https://github.com/AlexandroLeao/ami-108/actions/runs/44835514257) succeeded; all **four** tracked Prisma migrations finished without rollback, and Neon confirms five game tables plus `_prisma_migrations`. No game sessions exist yet. A protected Vercel deployment returned `/health` 200, `/icon.png` 200 and `/game` 404. Production Neon `main` remains unmigrated; remote Groq and public gameplay remain OFF. Owner Cloud Shell saves are untouched.

## Selected topology

- **Hobby / non-commercial**, one Vercel project named `ami-108`, repository root `./`, preset **Services**.
- Public catch-all: `web` (Next.js, `apps/web`), including its **existing** same-origin `/api/game` facade.
- Private `api` (NestJS, `apps/api`): Web receives `API_URL` via a Vercel service binding. **Never** add a public `/api` rewrite to NestJS; that would bypass the facade.
- Private `ai` (FastAPI, `services/ai`): API receives `AI_SERVICE_URL` via a Vercel service binding. The provider remains off unless separately activated and verified.
- Neon Free PostgreSQL is external, reached **only** from API. All database and provider credentials must be protected server-side; never store them in `vercel.json`, Git, screenshots or chat.

## Public-game runtime gate — default OFF

`AMI_DEV_PREVIEW` remains restricted to non-Vercel local development. A Vercel runtime will only expose game sessions if **all** of the following exist in the approved runtime configuration:

- `AMI_PUBLIC_GAME=1`, set **only after** deployment security approval.
- `AMI_PUBLIC_ORIGIN=https://<verified-https-host>`, an exact HTTPS origin with no path or trailing slash. Browser mutations still require same-origin requests.
- `AMI_API_INTERNAL_TOKEN`: matching, high-entropy secret (minimum 32 characters) on Web and API, stored in Vercel secrets. Web includes this header **only server-to-server**; NestJS rejects game requests without the correct value using constant-time comparison. Do not place the value in Git or the browser.
- `API_URL` and `AI_SERVICE_URL` are injected by Vercel service bindings. No public URL for NestJS or FastAPI is required.

Do not set `AMI_DEV_PREVIEW=1` to bypass this gate. The release switch alone does not establish abuse controls, quotas, database backups, end-to-end acceptance or owner approval. Keep the switch OFF for the first Vercel import/build and set `AMI_AI_GENERATION=0` while qualifying the environment.

## Required checks **before** importing/deploying

1. Confirm Vercel Hobby remaining project/usage allowance and Neon Free eligibility; do not enable billing or a paid tier. Multi-service requests and compute consume Hobby usage; free limits are **shared** and not a capacity guarantee.
2. Review and verify production-specific route enablement. The current `AMI_DEV_PREVIEW` gate is development-only and **must never be set to 1 on a public deployment** as a workaround. Confirm NestJS is not publicly exposed and the private bindings are functional.
3. Complete production security review: configured HTTPS origin, strict host/CSRF handling, session creation abuse/rate limits, cookie/security headers, restricted secrets and appropriate log retention. The private network alone is **not** client authentication.
4. Prepare disposable Neon database, plan migrations, test transaction locking, connection limits/pooling, retention, backups and recovery. Do not use the owner's Cloud Shell database or seven sessions.
5. Keep `AMI_AI_GENERATION=0` until explicit, isolated end-to-end Groq acceptance. Then verify bounded inference, quotas and fallback under a separate owner-approved activation.
6. Only after full build, runtime validation, private DB integration, manual PT-BR/EN browser and accessibility smoke, owner sign-off and cost checks: authorize production traffic and release tag.

This file is a deployment preflight, not an instruction to click **Deploy** now.

## Manual Neon preview migrations (no credential transfer in chat)

Neon project `ami-108-prod` has a separate migrated `preview` branch with **zero game sessions** as of November 20; the production `main` branch remains **empty/unmigrated** and outside this workflow. Vercel already stores separate encrypted pooled URLs for each environment; do not paste their contents into a PR, issue, log, or conversation.

Use the manual [`neon-preview-migrate.yml`](../.github/workflows/neon-preview-migrate.yml) GitHub Actions workflow **only after** the repository secret `NEON_PREVIEW_DATABASE_URL` has been created from the Neon Console, selecting project `ami-108-prod`, branch `preview`, database `ami`, role `ami_app`, and a direct/unpooled TLS connection if available. The workflow validates the exact preview endpoint hostname and database before any migration command. It never targets the production branch.

On GitHub, go to repository **Settings → Secrets and variables → Actions → New repository secret**, name it `NEON_PREVIEW_DATABASE_URL` and paste the connection URL directly there. Do not send the value to the assistant. Then use **Actions → Neon Preview Schema Migration → Run workflow**, choose `main` and enter `MIGRATE_PREVIEW`. It checks out reviewed code, installs the locked workspace, runs Prisma's tracked `migrate deploy` and verifies `migrate status`. The workflow cannot be triggered by a commit, PR, or schedule.

The owner dispatched [run 44835514257](https://github.com/AlexandroLeao/ami-108/actions/runs/44835514257) successfully, and the migration history plus five game tables were verified directly in Neon. **Do not re-run migration merely for acceptance.** Next, use the separate controlled integration test below. Production migration requires a separate change, verified evidence and owner release approval. Do not use Cloud Shell or its saved-session database.

## Manual real Neon preview persistence regression (after migration)

Run [`neon-preview-integration.yml`](../.github/workflows/neon-preview-integration.yml) on GitHub **Actions → Neon Preview Integration Acceptance → Run workflow**, branch `main`, confirmation `TEST_PREVIEW`. It uses the **existing** repository Actions secret `NEON_PREVIEW_DATABASE_URL`, validates the same pinned preview endpoint and runs only the existing `game.integration.spec.ts` tests against migrated Neon PostgreSQL. No Groq requests, no migrations, no production database and no changes to the local Cloud Shell runtime.

The tests use synthetic session tokens/commands and attempt cleanup of their own sessions. On success, verify Neon `preview` game row counts returned to zero. If a test aborts and leaves data, retain the evidence and investigate before further tests; do not issue blanket deletes or resets.

This proves NestJS/Prisma behavior against real Neon preview, **not** protected browser ↔ Vercel Web ↔ private API routing nor real Groq-in-game acceptance. Those remain independent release gates.

## Remote Neon Free performance investigation (open release blocker)

The manually dispatched full [Neon integration run #1](https://github.com/AlexandroLeao/ami-108/actions/runs/44836915249) passed 13/14 tests but hit a 5-second Chapter 1 timeout. After [PR #91](https://github.com/AlexandroLeao/ami-108/pull/91) increased the remote-only default timeout to 45 seconds, [run #2](https://github.com/AlexandroLeao/ami-108/actions/runs/44838128971) passed only 4/14, with repeated 30–60-second test timeouts and HTTP 503 responses. **The first issue was not simply insufficient timeout; do not blindly increase limits or rerun the exhaustive remote suite.** Both runs confirmed migration history and destination; subsequent Neon inspection found zero residual game rows and no deadlocks. The preview compute is configured at 0.25 CU (fixed). The runtime resource/connection bottleneck is suspected, **not proven**; 503 responses conceal the underlying exception by design. Production remains unmigrated and game/AI OFF.

Run the new manual-only `Neon Preview Latency Diagnostics` workflow (branch `main`, acknowledgement `DIAGNOSE_PREVIEW`) to collect **sanitized, read-only** connection, SELECT, count and transaction latency from a GitHub runner. It consumes the existing preview secret and is pinned to the same host/TLS/db/role. This is diagnostic data only, not gameplay certification: use the timings to decide on targeted database/connection improvements and a bounded, minimal remote E2E suite. Keep full exhaustive narrative/regression tests in local PostgreSQL CI. Do not change production compute, disable 503 fail-closed behavior or publish the game to mask failures.

## Verification

Run `node scripts/test-vercel-services-config.mjs` or use PR CI. This verifies the intended public route and bindings **statically**; the Vercel beta builder, actual service URLs and managed database require a separate real preview deployment. See [hosting assessment](zero-mandatory-cost-hosting-assessment.md) and [release readiness](release-readiness-matrix.md).
