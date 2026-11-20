# Vercel Services — pre-deployment gate

**State (November 20, 2026):** Vercel Hobby project and Neon Free project created. A protected Vercel preview proved Web build and `/health` 200, `/icon.png` 200, `/game` 404; production gameplay, Prisma migrations, persistent session E2E and remote Groq have **not** been accepted. The existing Cloud Shell runtime and owner saves are unchanged.

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

Neon project `ami-108-prod` has a separate empty `preview` branch. The production `main` branch is intentionally not part of this workflow. Vercel already stores separate encrypted pooled URLs for each environment; do not paste their contents into a PR, issue, log, or conversation.

Use the manual [`neon-preview-migrate.yml`](../.github/workflows/neon-preview-migrate.yml) GitHub Actions workflow **only after** the repository secret `NEON_PREVIEW_DATABASE_URL` has been created from the Neon Console, selecting project `ami-108-prod`, branch `preview`, database `ami`, role `ami_app`, and a direct/unpooled TLS connection if available. The workflow validates the exact preview endpoint hostname and database before any migration command. It never targets the production branch.

On GitHub, go to repository **Settings → Secrets and variables → Actions → New repository secret**, name it `NEON_PREVIEW_DATABASE_URL` and paste the connection URL directly there. Do not send the value to the assistant. Then use **Actions → Neon Preview Schema Migration → Run workflow**, choose `main` and enter `MIGRATE_PREVIEW`. It checks out reviewed code, installs the locked workspace, runs Prisma's tracked `migrate deploy` and verifies `migrate status`. The workflow cannot be triggered by a commit, PR, or schedule.

After it succeeds, independently verify `_prisma_migrations` and the five game tables on Neon `preview`; only then test disposable session persistence in the protected hosted environment. Production migration requires a separate change, verified evidence and owner release approval. Do not use Cloud Shell or its saved-session database.

## Verification

Run `node scripts/test-vercel-services-config.mjs` or use PR CI. This verifies the intended public route and bindings **statically**; the Vercel beta builder, actual service URLs and managed database require a separate real preview deployment. See [hosting assessment](zero-mandatory-cost-hosting-assessment.md) and [release readiness](release-readiness-matrix.md).
