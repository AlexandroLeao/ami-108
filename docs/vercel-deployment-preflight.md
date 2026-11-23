# Vercel deployment and verification

**Current state (verified November 21, 2026):** AMI-108 runs publicly at [ami-108.vercel.app/game](https://ami-108.vercel.app/game). The five-chapter game and constrained Groq inference are enabled in Production. Neon Production has **five tracked Prisma migrations and seven tables**, including database-backed daily public usage limits. The [accepted public release record](https://github.com/AlexandroLeao/ami-108/issues/15) documents signed-out game and source-repository access, with final reviewed commit `05acde1`, [exact-head CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44942053210) and READY deployment `dpl_EsxmJ2rNXyPmSFrMZvYPmkFjrx`. Preview and individual deployment URLs remain protected.

This document describes the **current topology and historical deployment verification**. Its earlier pre-launch migration and activation instructions are superseded and must not be rerun against an existing Production database. Current release state is owned by [release readiness](release-readiness-matrix.md).

## Deployed architecture

| Component | Hosting and role | Boundary |
| --- | --- | --- |
| Web | Next.js 16 on Vercel Services, same-origin `/api/game` facade | Canonical web entry point is public |
| Game API | NestJS through the private `API_URL` service binding | Must not be exposed through a public API rewrite |
| AI service | FastAPI through the private `AI_SERVICE_URL` service binding | Groq credentials and validated provider calls remain server-side |
| Data | Neon PostgreSQL 17, separate Production and Preview branches | Prisma migrations and saved session data must be preserved |
| CI | GitHub Actions | Builds, tests, contract checks, migration checks and source/history screening |

Vercel Hobby and Neon Free are the reviewed deployment choices. The objective is no mandatory paid resources, not a guarantee of unlimited traffic or cost. The Production domain can be visited without signing into Vercel; authentication remains on Preview and deployment-specific URLs.

## Production access and safeguards

- The Production game and Groq inference were accepted through owner-run PT-BR/EN sessions, saved-progress refresh/resume and a signed-out browser smoke. The original 16+ notice is an editorial advisory, not an official classification.
- `AMI_PUBLIC_GAME` and `AMI_AI_GENERATION` are deliberately controlled environment settings. The local-only `AMI_DEV_PREVIEW` setting must never authorize a public deployment.
- Private service bindings, origin checks, secret configuration and the database-backed `PublicDailyUsage` limits protect the hosted design within their documented scope. Public daily budgets are **50 new sessions** and **100 model attempts**, with HTTP 429 for exhausted new-session admission and authored fallback for exhausted inference.
- A Vercel WAF session-creation rule was configured during rollout, but its actual enforcement on Hobby was not independently certified. A second paid rule was not adopted. See [production security controls](architecture/production-security-gates.md).

## Historical rollout evidence

These records describe bounded checks performed **before or during** the November 2026 release. They are not instructions to repeat completed migrations or a claim of current service health.

| Stage | Recorded evidence | Boundary |
| --- | --- | --- |
| Preview schema | [Manual Preview migration](https://github.com/AlexandroLeao/ami-108/actions/runs/44835514257) and [real-Neon HTTP smoke](https://github.com/AlexandroLeao/ami-108/actions/runs/44841430897) | Earlier four-migration Preview baseline, before the public daily budget migration |
| Preview performance | [Latency diagnostics](https://github.com/AlexandroLeao/ami-108/actions/runs/44839824743) followed earlier full-suite timeouts and HTTP 503s | Earlier QA symptoms are historical, not current Production performance measurements |
| Hosted game and AI | [Protected QA evidence](final-qa-acceptance-worksheet.md) and [Groq evaluation](groq-inference-evaluation.md) | Bounded bilingual owner observations and validated receipts, not a scale test |
| Production migrations | [Guarded migration workflow](../.github/workflows/neon-production-migrate.yml) and [release acceptance](https://github.com/AlexandroLeao/ami-108/issues/15) | All five tracked migrations were applied. Do not rerun the first-time empty-database procedure |
| Public portfolio release | [PR #106](https://github.com/AlexandroLeao/ami-108/pull/106) and [exact-head CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44942053210) | Public source and canonical game verified, formal `v1.0.0` tag deferred |

The original pre-launch instructions and diagnostic chronology remain available in the repository's Git history and linked QA records. Do not apply an empty-database migration preflight to the now-populated Production schema.

## Future change verification

Before changing hosting or provider settings, confirm the exact reviewed commit, target environment, preserved saves, migration state, Free/Hobby quotas and secret scope. Use disposable test sessions, validate both languages and fallback behavior, and establish a recovery plan. Do not change paid plans or delete databases as a troubleshooting shortcut.

Run `node scripts/test-vercel-services-config.mjs` for the **static** Services configuration checks. CI and static checks cannot replace real ingress, provider, database, browser and accessibility verification. Record new evidence in the owning QA documents and keep the current release decision in [release readiness](release-readiness-matrix.md).
