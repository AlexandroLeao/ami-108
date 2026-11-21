# Vercel Services — pre-deployment gate

**State (November 21, 2026):** Vercel Hobby and Neon Free configured. [Preview migration](https://github.com/AlexandroLeao/ami-108/actions/runs/44835514257) applied four tracked Prisma migrations; [bounded real-Neon HTTP smoke](https://github.com/AlexandroLeao/ami-108/actions/runs/44841430897) passed 10 actions (median 47 ms, max 99 ms), leaving zero test rows at the time. **Vercel Authentication covers all deployments.** The owner completed a protected hosted gameplay QA across five chapters, both locales and desktop/mobile ([evidence scope](final-qa-acceptance-worksheet.md)). Only the reviewed Groq QA branch has scoped `AMI_PUBLIC_GAME=1`, `AMI_AI_GENERATION=1` and its branch-specific Sensitive provider key. The earlier image-fix QA branch retains a game-only switch. Generic Preview and Production remain OFF, and Production Neon remains unmigrated. Neon production `main` is unmigrated; Cloud Shell saves untouched.

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

## Required checks before enabling gameplay or releasing

1. Confirm Vercel Hobby remaining project/usage allowance and Neon Free eligibility; do not enable billing or a paid tier. Multi-service requests and compute consume Hobby usage; free limits are **shared** and not a capacity guarantee.
2. Review and verify production-specific route enablement. The current `AMI_DEV_PREVIEW` gate is development-only and **must never be set to 1 on a public deployment** as a workaround. Confirm NestJS is not publicly exposed and the private bindings are functional.
3. Complete production security review: configured HTTPS origin, strict host/CSRF handling, session creation abuse/rate limits, cookie/security headers, restricted secrets and appropriate log retention. The private network alone is **not** client authentication.
4. Prepare disposable Neon database, plan migrations, test transaction locking, connection limits/pooling, retention, backups and recovery. Do not use the owner's Cloud Shell database or seven sessions.
5. Keep `AMI_AI_GENERATION=0` until explicit, isolated end-to-end Groq acceptance. Then verify bounded inference, quotas and fallback under a separate owner-approved activation.
6. Only after full build, runtime validation, private DB integration, manual PT-BR/EN browser and accessibility smoke, owner sign-off and cost checks: authorize production traffic and release tag.

This is a **release gate**, not evidence of public gameplay readiness. Git integration already deploys technical builds; leave gameplay and AI disabled in production.

## Guarded Production schema workflow — deliberately not executed

The production Neon `main` branch is currently **empty (0 application tables)** and is separate from the seven saved QA sessions in `preview`. This new procedure **prepares** the schema but does not enable a public domain, game or AI. The owner must first review/merge the green-CI code, confirm the actual Free-plan quota, rights/classification/access and decide to authorize the migration. The [manual workflow](../.github/workflows/neon-production-migrate.yml) never runs on a push or PR.

1. From **Neon Console → project `ami-108-prod` → branch `main` → database `ami` → role `ami_app`**, copy the **direct/unpooled** TLS connection URL into GitHub Actions **repository secret** `NEON_PRODUCTION_DATABASE_URL`. Do not paste the URL or password into chat, Git files, issues or logs. The workflow does **not** read the Vercel Production URL.
2. On reviewed, green-CI `main`, choose **Actions → Manual guarded production schema migration → Run workflow**, branch `main`, input `MIGRATE_EMPTY_AMI_PRODUCTION`. Do not dispatch during other deployment/database maintenance.
3. The `preflight-production-db.cjs` guard verifies that the DB connection hostname is the **fixed Neon Production endpoint** (not Preview, not a pooled alias), role `ami_app`, database `ami`, TLS required, GitHub branch/confirmation correct, and all public-schema tables **completely absent**. It prints no connection string, password or raw Prisma error.
4. Only after those checks, Prisma `migrate deploy` applies **five additive tracked migrations**. A postcondition confirms all seven expected tables, exactly five completed migrations and **zero saved sessions**. A failed/partial run stops for investigation: **do not** reset/drop or repeat blindly, because the empty precondition will no longer pass.
5. Even after the schema passes, leave `AMI_PUBLIC_GAME=0` and `AMI_AI_GENERATION=0` in Production and Vercel Authentication ON. Separate, Production-specific provider secrets/origin, a protected smoke of the final code, budget verification and a publication decision are still required. An empty schema is **not** a successful public launch.

**Rollback/stop:** because this first schema migration starts from a verified-empty database, the safe immediate action after a problem is **keeping game/AI OFF**, preserving evidence and reviewing Prisma migration history. Do not automatically delete Neon branches or rewrite production history. The schema is intentionally not populated from QA or the owner's Cloud Shell backup.

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

## Bounded Neon preview HTTP smoke (separate from exhaustive regression)

The read-only [latency diagnostic run](https://github.com/AlexandroLeao/ami-108/actions/runs/44839824743) passed: cold Prisma connection **802 ms**; simple SELECT median **32 ms**, p95 **73 ms**; count median **32 ms**, p95 **80 ms**; read-only transaction median **127 ms**, p95 **159 ms**. These measurements do **not** explain or clear the HTTP 503 errors in the exhaustive stress-like sequence. [Issue #13](https://github.com/AlexandroLeao/ami-108/issues/13) retains that blocker.

The existing manual [Neon Preview Integration Acceptance](../.github/workflows/neon-preview-integration.yml) now distinguishes two explicitly acknowledged scopes on reviewed `main`:

- `SMOKE_PREVIEW`: short, synthetic **10-command** human-paced NestJS HTTP test with session creation, replay/idempotency, persisted view after app restart, and an explicit **5-second per-action** budget. Uses the same pinned Neon `preview` secret but converts its vetted direct host to the official PgBouncer `-pooler` endpoint for application-style traffic. Internal failures are logged only by exception kind and Prisma P-code, never raw error messages, tokens or URLs. Cleans **only** its own sessions. Afterward, independently check zero remaining preview game rows.
- `TEST_PREVIEW`: old exhaustive 14-test suite, **still failing 10/14** in run #2. Do not repeat blindly; exhaustive narrative correctness remains enforced by local PostgreSQL CI.

A green short smoke establishes **only** bounded backend/Neon persistence; it does not imply full gameplay E2E, Vercel private binding acceptance, Groq readiness or a public release. Keep game and AI flags OFF, production Neon unmigrated and user Cloud Shell saves untouched.

## Protected hosted QA branch — operational boundary

The project now uses Vercel Authentication for **all** deployments, including production. This remains a personal, non-commercial Hobby project. For a real hosted end-to-end test, create a **dedicated non-`main` QA branch** and use its protected Vercel preview deployment with Neon `preview`. Do not test against the un-migrated production Neon `main`.

Preconditions: exact QA branch/commit and Vercel deployment URL have been verified; all-deployments Vercel Authentication is still enabled; `DATABASE_URL` in Preview points to Neon `preview`; the private `API_URL` service binding and the server-only internal API token are configured; production `AMI_PUBLIC_GAME=0` and all `AMI_AI_GENERATION=0` remain unchanged. Never turn on `AMI_DEV_PREVIEW` on Vercel.

For a single reviewed QA branch, branch-specific encrypted Preview overrides can set `AMI_PUBLIC_GAME=1` and `AMI_PUBLIC_ORIGIN` to its **exact stable HTTPS branch alias** (no trailing slash). Vercel explicitly allows branch-scoped overrides. Do not enable the generic Preview environment or Production to do this. Environment changes require a fresh Preview deployment and proof that the new build belongs to that branch. Do not use expiring deployment-specific URLs as `AMI_PUBLIC_ORIGIN` when the build must be replaced. Retain SSO before, during and after the test. The branch-scoped flag must be removed or set back to 0 once testing ends.

Acceptance: using an authenticated owner browser on the stable branch URL, confirm game page loads, create a **disposable** session, move through a few actions, refresh and resume, verify replay/cookie/CSRF behavior and error states. Record Vercel build/deployment ID, exact branch, response status, observed latency, and Neon preview session counts. Do not import real Cloud Shell saves. If any step returns 503/401/403 unexpectedly, stop; inspect redacted Vercel logs and private binding configuration without bypassing guards. Remove only known disposable test sessions after owner approval; never reset the database. A successful GitHub-runner smoke is not a substitute.

**Rollback:** disable branch-specific `AMI_PUBLIC_GAME` / `AMI_AI_GENERATION`, redeploy that QA branch and verify `/game` returns 404. Never copy QA flags or Neon Preview credentials into Production. Protected Groq QA acceptance is recorded in the [Groq evidence](groq-inference-evaluation.md).

**Owner QA acceptance (November 21):** the branch `fix/vercel-private-scene-assets-20261121`, commit `eb3994358c41117a46c602fc1748179af7793758`, included the private PNG loader and was reported playable through credits on desktop/mobile in PT-BR/EN with successful refresh/resume. This is owner-observed end-to-end functional evidence, not independent hostile-request testing, AI inference, or production approval. The reviewed candidate later passed [Actions CI 44913252085](https://github.com/AlexandroLeao/ami-108/actions/runs/44913252085) at commit `625feaa`; subsequent editorial commits still require their own CI. See [QA worksheet](final-qa-acceptance-worksheet.md).

## Database-backed public-day budget candidate — pending CI and release approval

The candidate adds an additive `PublicDailyUsage` table and two atomic aggregate UTC-day limits: **50 new sessions/day** and **100 attempted Groq calls/day**, independent of source IP or replica. The second guard falls back to approved text with `BUDGET_EXCEEDED`; new session creation fails with HTTP 429 `CAPACITY_LIMIT` when full. Read the authoritative security design in [production security gates](architecture/production-security-gates.md). The private/local gameplay path is unchanged.

This is not enabled on the existing QA deployment yet; **the new migration must be applied deliberately before testing the candidate**. Production still contains no game tables and remains closed. A later operator may stage the exact reviewed, green-CI commit against a disposable migrated QA database first, then obtain explicit owner approval for the production migration and live domain. Never use `prisma db push`, drop, reset or restore against a nonempty saved-data database.

The project-wide WAF currently displays one valid configured session-creation rule. A subsequent attempt to add a separate commands limit returned Vercel **402 `payment_required`** on the Hobby plan; **actual enforcement of the earlier configured rule has not been verified**. Do not present WAF config presence as bill-free rate-limit enforcement. The database-backed budget is therefore an independent, fail-closed control, not a replacement for capacity/security monitoring.

## Current firewall control and portfolio publication boundary — November 21, 2026

Vercel project firewall was inspected as **enabled** with one active, valid rate-limit rule `ami-game-session-create-5-per-minute-per-ip` (ID `rule_ami_game_session_create_5_per_minute_per_ip_3Y5Vwg`). It matches **POST `/api/game/session`** and denies requests above **5 per IP / 60-second fixed window**. The rule leaves current-session commands, assets, reads and per-session provider replay untouched. It has **not** been load-tested or verified as a global AI-budget policy.

**Observe/rollback:** use the Vercel Firewall dashboard to review hits and any legitimate blocked new sessions. If a verified regression occurs, remove **only this rule** by ID and rerun owner QA; do not disable the whole firewall or bypass SSO. Confirm Hobby included usage at the time of any public launch. Do not increase provider quotas or billing to solve a request spike.

**Public-portfolio prerequisite checklist:** review committed source **and history** for secrets, private story assets, spoiler policy and third-party licenses before changing repository visibility. Confirm the applicable MJSP classification/authorized self-rating route for a directly hosted browser game (the 16+ notice is not official). Establish acceptable public authentication/abuse/model quota controls. Migrate **only an explicitly verified-empty Production Neon database** with a restore/rollback plan and separately scoped Production secrets and public Origin; stage the exact release commit and smoke it in both languages with disposable state before removing Vercel protection. Only then approve the public game URL and repository URL and test both from a logged-out browser. None of these public switches occurred during this audit. See [release readiness](release-readiness-matrix.md).

## Historical: hosted NestJS runtime module resolution — November 20 QA finding

The owner opened the protected `qa/hosted-vercel-acceptance-20261120` game URL; Next.js rendered the content warning, but starting a game failed. Vercel runtime logs on deployment `dpl_9b6AhCNWZ3L8zC3QHvftJsEAENCp` identify **`Cannot find module 'reflect-metadata'`**, from `/var/task/main.js`, followed by process exit 1 on `POST /game/session`. The `reflect-metadata` runtime dependency **already exists** in `apps/api/package.json`, so adding it again or resetting Neon does not address the observed failure.

The Vercel Services pnpm workspace builder has a documented [output-directory flattening bug](https://github.com/vercel/vercel/issues/17651): compiled `dist/main.js` is placed at the function root, where package symlinks and dependency paths cannot resolve. A first candidate using `src/main.ts` plus `outputDirectory: .` corrected the flattened entrypoint but **still failed at runtime** (`TypeError: ... Get is not a function` from a bundled controller decorator). Source-level bundling of decorated TypeScript is not acceptable. The second candidate uses a tiny CommonJS entrypoint `src/server.cjs` that loads **the `dist/main.js` compiled by `tsc`**, and `outputDirectory: .` to preserve the workspace tree. This retains NestJS decorator metadata and source-relative module resolution in principle. The [Vercel source-tracing issue](https://github.com/vercel/vercel/issues/17712) remains relevant. **Not accepted until protected QA proves that GET /api/game/view without a cookie returns HTTP 401 (actual API started), followed by an owner-controlled session creation.** A successful build or page GET is insufficient.

Do not activate production gameplay, perform migrations, change secrets, create owner save imports or remove SSO for this failure. On successful protected QA runtime acceptance, document a release-gate test and then merge the reviewed change.

## Verification

Run `node scripts/test-vercel-services-config.mjs` or use PR CI. This verifies the intended public route and bindings **statically**; the Vercel beta builder, actual service URLs and managed database require a separate real preview deployment. See [hosting assessment](zero-mandatory-cost-hosting-assessment.md) and [release readiness](release-readiness-matrix.md).
