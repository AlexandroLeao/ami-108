# Vercel Services — pre-deployment gate

**State (November 20, 2026):** repository configuration only. No Vercel deployment, Neon project, public game, persistent database or production Groq traffic is certified.

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

## Verification

Run `node scripts/test-vercel-services-config.mjs` or use PR CI. This verifies the intended public route and bindings **statically**; the Vercel beta builder, actual service URLs and managed database require a separate real preview deployment. See [hosting assessment](zero-mandatory-cost-hosting-assessment.md) and [release readiness](release-readiness-matrix.md).
