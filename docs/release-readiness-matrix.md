# AMI-108 release readiness and next-session matrix — November 19, 2026

This is an evidence index and resumption plan, **not a release certificate or a production deployment plan**. It distinguishes verified GitHub CI and owner-observed local behavior from missing acceptance evidence. Keep the repository private and the mandatory cost target at R$ 0. Do not publish, tag `v1.0.0`, provision paid resources, change accepted content, or delete local saves from this document.

## Verified Cloud Shell recovery — November 19 (owner terminal evidence)

A newer owner recovery log supersedes the pre-pause uncertainty **for that local recovery only**. With a fresh Docker VM and no previous AMI containers or volumes, the owner verified `pause-ami108-20261119T203206Z-180786.dump` (160,719 bytes, SHA-256 PASS), PostgreSQL 17 archive table listing and a complete `pg_restore --file=/dev/null` read. An empty `ami-108_postgres_data` was created after confirming zero public tables, and the archive was restored once with `--single-transaction --exit-on-error --no-owner --no-acl`. The restored database contained **6 GameSession, 0 GamePendingGeneration and 4 completed Prisma migrations**.

At accepted local runtime `14ea583`, the owner rebuilt Web/API/AI and started them alongside the restored database. All four Compose services and three health endpoints were healthy, the database container ID and counts were unchanged, and the API was explicitly started with `AMI_AI_GENERATION=0` as a temporary safety gate while Ollama remains absent. The owner then confirmed that the existing saved game **Continued normally** in the browser. Root free disk was 27 GiB after builds. This is successful **saved-game recovery**, **not** proof that actual AI generation is currently enabled; restore the pinned local Ollama on its internal-only network, run the exact bilingual 10-case validation, and re-enable game generation separately after another non-secret count/health check. Do **not** rerun `pg_restore`, recreate the DB volume, remove existing images/volumes, or create new sessions before that controlled activation.

## Latest owner-confirmed end-of-day checkpoint — November 20 UTC

After accepting desktop/mobile PT-BR/EN local AI gameplay, the owner completed the safe Cloud Shell pause. The verified private PostgreSQL archive `pause-ami108-20261120T005447Z-121510.dump` is **182,626 bytes**, passed both full archive read and SHA-256, and recorded **7 GameSession / 0 pending / 4 finished migrations**. All Web/API/AI/PostgreSQL/Ollama containers stopped; there was **no volume removal**. The earlier six-session count in the recovery narrative below is intentionally historical. Do not re-run the backup script just because the release matrix is updated, and do not publish the private dump or secrets.

## Version and pause boundary

| Item | Last supported evidence | Limit |
| --- | --- | --- |
| Accepted game runtime | Owner installed `14ea583a83c7c1473bc94f3b1d515a8497827ac3` on private port 3000, approved new-game AI variety and intact Continue | Not a public production release |
| Documentation and recovery tooling | [Current GitHub main](https://github.com/AlexandroLeao/ami-108/tree/main) contains later README, documentation-audit and pinned-model preparation PRs, with successful exact CI; these do not modify the accepted application runtime | Do not assume a merged operational script was run on the user's VM; verify its independent owner test result |
| Code validation | [Exact PR #53 CI 44603955413](https://github.com/AlexandroLeao/ami-108/actions/runs/44603955413) green: 105 API, 44 Web, 72 Python = 221 tests, four migrations, Prisma validation, lint/typecheck/build, full built campaign and 12 original artwork hashes | CI uses disposable state; does not validate hosted runtime |
| AI gameplay | Disposable port 3002 full playthrough: seven VALIDATED/zero fallback; 2/2 distinct DOG RANDOM, 2/2 RAT RANDOM, Qwen2.5:1.5b pinned ID 65ec06548149 resident (`Forever`). Owner then accepted fresh port 3000 game | Only one intro in preview; no cross-session uniqueness guarantee with finite eight-option pool. Old Continue text is intentionally immutable |
| Saves and backup | The newer final `pause-ami108-20261119T203206Z-180786.dump` was SHA-256-verified and read completely. The owner restored **6 sessions / 0 pending / 4 migrations** into a formerly empty DB, rebuilt all four services and confirmed Continue | No further restore on this populated database; private raw archive and .env are never uploaded to the repository |
| Dependency review | JS production/full locked audits zero known at PR #48; prior Python locked audit zero known, Prisma scoped override and full CI compatibility checks | Not an OS/container, licensing, complete application or future advisory clearance |
| Cost and visibility | Private GitHub, local Cloud Shell only, no mandatory paid resources provisioned | Zero-cost **public hosting** not yet verified or approved |

## Formal issue acceptance checklist

| Issue | Verified / completed | Open before closure | Next owner or engineer action |
| --- | --- | --- | --- |
| [#12 — AMI-010 QA/security](https://github.com/AlexandroLeao/ami-108/issues/12) | Campaign and persistence CI; local AI and fallback; current-only assets/session controls; dependency remediation; owner passed Continue/keyboard/zoom/mobile; initial health endpoint latency | Screen-reader PT/EN, reduced motion, automated accessibility scan, real browser/rendering performance; production trusted origin and ingress limits, quotas/model concurrency, expired-session retention, OS/image security | Use disposable browser/profile/DB and measured tests. No development save mutation; fix only reproduced defects after owner approval |
| [#13 — AMI-011 infrastructure](https://github.com/AlexandroLeao/ami-108/issues/13) | Local Docker Compose, GitHub CI and [production boundary proposal](architecture/production-security-gates.md) | Verified zero mandatory-cost hosting option, provider quotas/terms, owner consent, private network/TLS, secrets, monitoring, reproducible deployment and restore | Evaluate options and ownership/billing policies at next session; no public or paid deployment in absence of explicit decision |
| [#14 — AMI-012 documentation](https://github.com/AlexandroLeao/ami-108/issues/14) | Current README, development/architecture/QA docs, local OpenAPI reconciliation, [Cloud Shell pause/resume](cloud-shell-pause-resume.md), AI-assisted portfolio attribution | **Private Master v1.14 / Script v1.12 still contain Day 3 front matter (4/5 chapters, Chapter 5 draft)**; reconcile with owner-approved complete Chapter 5 and later amendments, preserve private source, then finalize deployment-specific instructions, external cost/limitations evidence and portfolio audit | Inspect canonical private sources via authorized connected storage on return, without copying their contents into the public-facing repository |
| [#15 — AMI-013 release](https://github.com/AlexandroLeao/ami-108/issues/15) | Complete private five-chapter playtest accepted and CI regressions green | Formal release QA/security/deployment blockers; PT/EN final evidence, legal/content classification, asset/license/distribution rights, repository visibility, explicit owner release approval | No tag `v1.0.0` and no public access until these are signed off |

The prior seven-day calendar goal (Nov 16–22) is a planning target, **not permission to skip release gates**. Replan if evidence requires more time.

## Current local status — owner AI checks passed; safe pause COMPLETE

The final archived pause backup was verified and restored into a formerly empty PostgreSQL, preserving **6 sessions / 0 pending / 4 completed migrations** at the recovery checkpoint. The pinned local-only Qwen2.5:1.5b was reinstalled, passed a warmed **10/10 real bilingual direct FastAPI** evaluation (individual **1220–1711 ms**), stayed resident (`Forever`) on an internal-only network with 3 GiB container cap, and the API was safely activated with `AMI_AI_GENERATION=1` and three healthy endpoints; existing Continue worked. Prior initial first-load 8/10 with two timeouts is historical timing evidence.

**Owner-observed browser acceptance is now reported complete:** On November 19, the owner tested the recovered game on **desktop and mobile**, in **Brazilian Portuguese and English**, observed normal gameplay/Continue and **more varied RANDOM responses**. This closes the specific functional owner-confirmation gate for fresh-session local AI and variation. It does **not** give a quantified E2E `VALIDATED` receipt count, prove every alternative was model-selected rather than the game's authorized varied fallback, or satisfy formal screen-reader, reduced-motion, automated security or sustained latency requirements.

1. **Tonight — COMPLETED:** The owner ran the reviewed [dynamic-count safe pause](cloud-shell-pause-resume.md). Terminal evidence proves **7 sessions / 0 pending / 4 migrations**, a new **182,626-byte** PostgreSQL custom archive fully read with SHA-256 PASS, private `.env` copy, and stopped Web/API/AI/DB/Ollama without deleting volumes. The exact backup filename is `pause-ami108-20261120T005447Z-121510.dump`. No new pause or restore is needed now; Cloud Shell may remain closed.
2. **Next session:** Inspect the retained private dump and Docker state **before** running anything. If the Cloud Shell VM was recycled, do not restore into an existing/nonempty DB. Continue issue **#12** formal browser accessibility (screen reader PT/EN, reduced motion, automated audit), security review and measured performance.
3. Reconcile private canonical Master v1.14 / Script v1.12 Chapter 5 status under **#14**; evaluate verifiable zero mandatory-cost hosting/security under **#13** without provisioning paid resources; retain **#15** open until classification, rights and explicit owner release approval.

Earlier VM-recovery guidance was for a now-completed operation; see [archived recovery checklist](release-readiness-history.md) when auditing prior steps.

## Safeguards and non-goals

- **No destructive cleanup**: no `docker compose down -v`, `docker system prune`, manual save edits, or archive restoration into nonempty PostgreSQL. The last supplied post-rebuild root filesystem had 27 GiB free, but resource availability changes across Cloud Shell sessions: remeasure before any model download.
- **AI remains bounded**: use pinned local model and internal-only Ollama, token authentication, distinct authorized RANDOM options, 2s transport / 2.5s application deadline, fallback, and immutable cached slots. Correct-answer probabilities and BOAR authored-only behavior remain unchanged.
- **Privacy**: keep `.env` and raw `.dump` private; only aggregates and non-secret test receipts belong in GitHub issues.
- **Scope**: this matrix adds no infrastructure or application functionality; pending checks are not falsely marked passed.
