# Production security gates — proposed, not enabled

Refs AMI-010 (#12), AMI-011 (#13). The approved local preview remains private; no public hosting, new resources, schema changes, quota values or architectural decisions are authorized by this proposal. The production deployment choice must be reviewed separately.

## Current observed boundary

- Next.js root and game facade and NestJS game controller require AMI_DEV_PREVIEW=1. Development artwork route is also gated. Default mode is diagnostic, not a production game.
- Browser mutations require Origin, reject cross-site fetch metadata and compare configured origin when present. Local preview otherwise accepts the request/forwarded host because Cloud Shell is reverse-proxied. Never trust this fallback on public ingress.
- Facade allowlists five endpoints and methods; raw mutation JSON limited to 2048 bytes with absolute 10s handler deadline; upstream fetch deadline 10s. API directly uses Nest body parsing; must not be exposed to untrusted public callers. Ingress buffering/header time and connection counts are not covered by handler deadline.
- Session capability is a random 32-byte token, digest at rest, 30-day provisional expiry, current-scene asset gate, private/no-store, cookie HttpOnly/SameSite=Lax. HTTPS facade adds Secure. Existing saves must remain compatible.
- Per-session database locking and pending-generation reservation prevent duplicate model calls for a reserved slot; receipt idempotency and cached slots are enforced. These are not cross-session quotas. New sessions can still allocate rows and inference capacity.
- FastAPI generation endpoint uses shared internal bearer token and 8192-byte request bound. Ollama and PostgreSQL must remain internal; provider deadlines 2s transport / 2.5s engine; authored fallback on failure. No model authority over game outcomes.

## Deployment-independent acceptance gates

| Gate | Required evidence |
| --- | --- |
| Mode and origin | Explicit production opt-in; HTTPS canonical origin with no credentials/path/query/fragment; invalid or contradictory settings fail closed. Development routes inaccessible. Spoofed Host/X-Forwarded-Host cannot authorize mutation. |
| Network | Only web ingress public; API, AI, model and DB private. No public database or model endpoint. Explicit trusted proxy configuration and secure cookies. |
| Abuse | Separate creation, mutation, asset/read and inference limits; derive values from measured workload and agreed capacity. Edge source identity must not trust arbitrary forwarded headers. Bounded memory, connection/time budgets and aggregate cap. |
| Concurrency | Cap simultaneous model work across sessions, preserve per-session reservations/idempotency and fall back using existing BUDGET_EXCEEDED reason when capacity unavailable. Do not alter approved probabilities, cached slots, deadlines or energy. |
| Responses | Clear rate-limit/retry semantics; client must not consume energy or advance state on rejected requests. Validate concurrent legitimate clients, duplicate commands, stale revisions and repeated retry. |
| Storage | Define owner-approved retention, expired-session cleanup, cascading dependent records, backup/restore and minimum necessary telemetry. Do not delete existing saves during development. |
| Browser | Baseline headers; deployment-specific CSP, frame-ancestors and HSTS after HTTPS validation. Cloud Shell embedding must not be broken. |
| Operations | Private secrets, least privilege, redacted logs, health/readiness, dependency and OS/image review, recovery drill, verified cost constraints. |

## Proposed validation before publication

Use disposable database and test-only secrets, run full 215-test baseline plus built campaign/hash smoke. Test missing/invalid origin, cross-site, forwarded-host spoof, disabled modes, development route denial, cookie Secure, private network boundary, expired sessions, oversized and slow uploads, rate exhaustion/recovery and concurrent distinct sessions. Confirm fallback does not change category, energy debit, slot persistence or replay. Measure memory and queue behavior under controlled synthetic load; do not stress the owner's running local game. Document concrete rate/quota policy after capacity and hosting are known.

Do not implement a public toggle alone. A production entry point without trusted ingress, quotas and retention is not release-ready. Keep the repository private and no billable provisioning until owner review of the deployment decision.
