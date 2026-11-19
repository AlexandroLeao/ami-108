# AMI-108 release readiness and next-session matrix — November 19, 2026

This is an evidence index and resumption plan, **not a release certificate or a production deployment plan**. It distinguishes verified GitHub CI and owner-observed local behavior from missing acceptance evidence. Keep the repository private and the mandatory cost target at R$ 0. Do not publish, tag `v1.0.0`, provision paid resources, change accepted content, or delete local saves from this document.

## Version and pause boundary

| Item | Last supported evidence | Limit |
| --- | --- | --- |
| Accepted game runtime | Owner installed `14ea583a83c7c1473bc94f3b1d515a8497827ac3` on private port 3000, approved new-game AI variety and intact Continue | Not a public production release |
| Documentation main | PR #54 merged `99bbf8e7bb57d330aee020a16fe54d4b5017f4b9`; post-merge [CI 44609150270](https://github.com/AlexandroLeao/ami-108/actions/runs/44609150270) succeeded | Docs-only; Cloud Shell need not rebuild |
| Code validation | [Exact PR #53 CI 44603955413](https://github.com/AlexandroLeao/ami-108/actions/runs/44603955413) green: 105 API, 44 Web, 72 Python = 221 tests, four migrations, Prisma validation, lint/typecheck/build, full built campaign and 12 original artwork hashes | CI uses disposable state; does not validate hosted runtime |
| AI gameplay | Disposable port 3002 full playthrough: seven VALIDATED/zero fallback; 2/2 distinct DOG RANDOM, 2/2 RAT RANDOM, Qwen2.5:1.5b pinned ID 65ec06548149 resident (`Forever`). Owner then accepted fresh port 3000 game | Only one intro in preview; no cross-session uniqueness guarantee with finite eight-option pool. Old Continue text is intentionally immutable |
| Saves and backup | Verified private `pre-variety-20261119-201700.dump` before installation, five sessions and zero pending at installation; user reported Cloud Shell shutdown after separate pause instructions | **No final shutdown terminal report supplied**. The latest backup filename, verification and counts are not independently confirmed. Cloud Shell Docker volume/VM may be recycled |
| Dependency review | JS production/full locked audits zero known at PR #48; prior Python locked audit zero known, Prisma scoped override and full CI compatibility checks | Not an OS/container, licensing, complete application or future advisory clearance |
| Cost and visibility | Private GitHub, local Cloud Shell only, no mandatory paid resources provisioned | Zero-cost **public hosting** not yet verified or approved |

## Formal issue acceptance checklist

| Issue | Verified / completed | Open before closure | Next owner or engineer action |
| --- | --- | --- | --- |
| [#12 — AMI-010 QA/security](https://github.com/AlexandroLeao/ami-108/issues/12) | Campaign and persistence CI; local AI and fallback; current-only assets/session controls; dependency remediation; owner passed Continue/keyboard/zoom/mobile; initial health endpoint latency | Screen-reader PT/EN, reduced motion, automated accessibility scan, real browser/rendering performance; production trusted origin and ingress limits, quotas/model concurrency, expired-session retention, OS/image security | Use disposable browser/profile/DB and measured tests. No development save mutation; fix only reproduced defects after owner approval |
| [#13 — AMI-011 infrastructure](https://github.com/AlexandroLeao/ami-108/issues/13) | Local Docker Compose, GitHub CI and [production boundary proposal](architecture/production-security-gates.md) | Verified zero mandatory-cost hosting option, provider quotas/terms, owner consent, private network/TLS, secrets, monitoring, reproducible deployment and restore | Evaluate options and ownership/billing policies at next session; no public or paid deployment in absence of explicit decision |
| [#14 — AMI-012 documentation](https://github.com/AlexandroLeao/ami-108/issues/14) | Current README, development/architecture/QA docs, local OpenAPI reconciliation, [Cloud Shell pause/resume](cloud-shell-pause-resume.md), AI-assisted portfolio attribution | Synchronize **private** Documento Mestre v1.14 and Roteiro Interativo v1.12 with approved amendments; final deployment-specific instructions, external cost/limitations evidence and final portfolio audit | Inspect canonical private sources via authorized connected storage on return, without copying their contents into the public-facing repository |
| [#15 — AMI-013 release](https://github.com/AlexandroLeao/ami-108/issues/15) | Complete private five-chapter playtest accepted and CI regressions green | Formal release QA/security/deployment blockers; PT/EN final evidence, legal/content classification, asset/license/distribution rights, repository visibility, explicit owner release approval | No tag `v1.0.0` and no public access until these are signed off |

The prior seven-day calendar goal (Nov 16–22) is a planning target, **not permission to skip release gates**. Replan if evidence requires more time.

## First ten minutes of the next session

1. Inspect the current Google Cloud Shell environment read-only before starting, building or restoring anything: `git status --short --branch`, `git rev-parse HEAD`, `df -h / /home`, `docker compose ps -a`, `docker volume ls`, and private backup filenames/size. Check the pause command's reported final `SAFE PAUSE COMPLETE` if available. Do not paste `.env`, cookies, secrets or save payloads.
2. Verify the newest actual `pause-ami108-*.dump` checksum and archive integrity from [pause/resume runbook](cloud-shell-pause-resume.md). An earlier pre-variety dump exists as a fallback, but it may lack saves created afterward; do not overwrite a nonempty database.
3. Determine if the Docker VM, volumes, models and private network survived. If yes, start existing DB and model then AI/API/Web carefully, confirming four migrations, counts, private connectivity, ten-case AI evaluator and Continue. If no, create a fresh empty DB and request a controlled backup restore plan before any write. Do not assume Docker persistence.
4. If the local runtime remains `14ea583`, the newer documentation-only main commit does not require an image rebuild. Fast-forward only after reviewing the diff and backup state.
5. Resume the two most independent QA areas: screen-reader/reduced-motion/browser audit and deployment-cost/security design. Do not modify the frozen narrative, images, mechanics, cached responses or production visibility without specific review.

## Safeguards and non-goals

- **No destructive cleanup**: no `docker compose down -v`, `docker system prune`, manual save edits, or archive restoration into nonempty PostgreSQL. Root space was 13 GiB free / 90% used at the last supplied deployment log; remeasure before new images.
- **AI remains bounded**: use pinned local model and internal-only Ollama, token authentication, distinct authorized RANDOM options, 2s transport / 2.5s application deadline, fallback, and immutable cached slots. Correct-answer probabilities and BOAR authored-only behavior remain unchanged.
- **Privacy**: keep `.env` and raw `.dump` private; only aggregates and non-secret test receipts belong in GitHub issues.
- **Scope**: this matrix adds no infrastructure or application functionality; pending checks are not falsely marked passed.
