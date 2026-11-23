# Production security controls and remaining risks

**Status (November 21, 2026):** The five-chapter game and bounded Groq inference are publicly accessible on the canonical Production domain. Neon Production has all five tracked migrations, including `PublicDailyUsage`. Issues [#12](https://github.com/AlexandroLeao/ami-108/issues/12), [#13](https://github.com/AlexandroLeao/ami-108/issues/13) and [#15](https://github.com/AlexandroLeao/ami-108/issues/15) were closed for their documented acceptance scopes. These safeguards do **not** amount to a comprehensive security audit or load certification. The authoritative evidence and release boundary are in [release readiness](../release-readiness-matrix.md).

## Implemented controls

- **Service boundaries:** Vercel exposes the Next.js same-origin facade. NestJS API and FastAPI AI service use private service bindings, and PostgreSQL is accessed server-side. Development-only routes must never be exposed through public-mode configuration.
- **Request validation:** Browser mutations check origin and cross-site metadata. The facade allowlists supported endpoints/methods, rejects oversized mutation bodies (2048 bytes) and applies a 10-second upstream deadline. Backend endpoints must remain inaccessible from untrusted public ingress.
- **Session authorization:** Random 32-byte bearer capability, digest at rest, `HttpOnly`/`SameSite=Lax` cookie with `Secure` on HTTPS, 30-day provisional expiry, private/no-store projections and authorization of only current-scene assets.
- **Game consistency:** Transactional state changes, per-session locking, reserved consultations and idempotent command receipts prevent duplicate debits, rerolls and repeated provider calls for a reserved slot. They do not themselves provide cross-session admission limits.
- **AI boundary:** Authenticated internal FastAPI requests, allowlisted facts, bounded generation time and response validation. Groq selects only among authored answers, with deterministic fallback; it cannot determine game outcomes or access future narrative material.
- **Deployment protection:** The canonical Production game is publicly accessible. Preview and deployment-specific URLs remain protected by Vercel Standard Protection. Protection of those URLs is distinct from security of the public game.

## Database-backed public usage limits

The production-applied migration `20261121190000_public_daily_usage` adds a `PublicDailyUsage` row per UTC day. In public mode, an atomic PostgreSQL update limits the system to **50 new sessions per day** and **100 attempted model calls per day** across serverless instances. Counts contain no IP address, session token or prompt.

- At the session limit, `POST /api/game/session` returns **HTTP 429 `CAPACITY_LIMIT`**. Previously created sessions are not deleted.
- At the provider-attempt limit, or if the quota query fails, consultation uses the authorized `FALLBACK_REQUIRED/BUDGET_EXCEEDED` response. It does not bypass the quota with automatic retries or alternate providers.
- These budgets do not cap all reads, already-established sessions, concurrent functions or total platform consumption. Groq provider quotas also apply.

The code and database migration were validated in reviewed CI and the Production deployment was accepted in the [portfolio release record](https://github.com/AlexandroLeao/ami-108/issues/15). No exhaustive anonymous load or sustained-rate testing is claimed.

## Remaining security and operational limitations

| Area | Observed safeguard | Further validation or policy |
| --- | --- | --- |
| Rate and abuse protection | Database-wide creation and provider-attempt budgets; one Vercel WAF session-creation rule configured | Actual enforcement on the Hobby plan was not independently demonstrated. Other endpoint and multi-IP abuse remain outside the bounded checks |
| Traffic and concurrency | Same-origin routing, private service bindings and per-session reservation | Measure concurrent sessions, model workload, connection pressure and abuse behavior with disposable test data |
| Browser and network | Origin checks, scoped cookies, protected previews, private services | Independently assess public ingress, headers, spoofed forwarded hosts, CSRF and current-asset access |
| Data lifecycle | Scoped PostgreSQL sessions and 30-day expiry semantics | Review retention, cleanup, backups, recovery and minimum necessary logs before extending traffic |
| Dependencies and accessibility | Automated checks and owner-reported functional smoke | Separate OS/container security, accessibility and performance validation remain necessary |

A second Vercel WAF rate-limit rule was not adopted because its configuration returned HTTP 402 on Hobby. Do not infer unlimited rate limiting from a configured rule or enable billing to bypass these limits.

## Safe change and verification boundary

For any future production configuration change, preserve existing saves and perform read-only environment checks before migration or rollback decisions. Do not run `prisma db push`, reset a populated database, delete session records to clear budgets, expose private service URLs or commit secrets. Use [Vercel deployment history and procedures](../vercel-deployment-preflight.md), [QA evidence](../release-qa.md) and [release readiness](../release-readiness-matrix.md) as separate sources. No infrastructure was changed by this documentation update.
