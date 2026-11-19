# Release QA and security evidence — AMI-010

## Verified Cloud Shell recovery — November 19 (owner terminal evidence)

A newer owner recovery log supersedes the pre-pause uncertainty **for that local recovery only**. With a fresh Docker VM and no previous AMI containers or volumes, the owner verified `pause-ami108-20261119T203206Z-180786.dump` (160,719 bytes, SHA-256 PASS), PostgreSQL 17 archive table listing and a complete `pg_restore --file=/dev/null` read. An empty `ami-108_postgres_data` was created after confirming zero public tables, and the archive was restored once with `--single-transaction --exit-on-error --no-owner --no-acl`. The restored database contained **6 GameSession, 0 GamePendingGeneration and 4 completed Prisma migrations**.

At accepted local runtime `14ea583`, the owner rebuilt Web/API/AI and started them alongside the restored database. All four Compose services and three health endpoints were healthy, the database container ID and counts were unchanged, and the API was explicitly started with `AMI_AI_GENERATION=0` as a temporary safety gate while Ollama remains absent. The owner then confirmed that the existing saved game **Continued normally** in the browser. Root free disk was 27 GiB after builds. This is successful **saved-game recovery**, **not** proof that actual AI generation is currently enabled; restore the pinned local Ollama on its internal-only network, run the exact bilingual 10-case validation, and re-enable game generation separately after another non-secret count/health check. Do **not** rerun `pg_restore`, recreate the DB volume, remove existing images/volumes, or create new sessions before that controlled activation.


## Most recent owner acceptance and pause status — November 19, 2026

The owner completed the full isolated PR #53 playtest at port 3002 (7/7 VALIDATED, zero timeouts; DOG/RAT each 2 distinct RANDOM texts from 2 slots; one intro only, so cross-session intro diversity not measured). Exact PR CI 44603955413 and post-merge main CI 44606120570 passed both jobs, 221 tests, existing four migrations and complete campaign with twelve original hashes; merged `14ea583`. Owner installed this commit at port 3000 with a verified private backup `pre-variety-20261119-201700.dump`, five sessions and zero pending at install, healthy web/API/AI/DB, pinned Qwen `Forever`, direct 10/10. The owner later confirmed a **fresh game** has the expected varied behavior; old Continue sessions intentionally retain cached responses. No new gameplay receipt audit was supplied for that fresh live game.

Cloud Shell pause is requested. The safe [pause/resume runbook](cloud-shell-pause-resume.md) documents a new checkpoint and the ephemeral Docker-volume risk; final shutdown **not yet verified**. All PRs through #53 merged; formal issues #12–#15 stay open for remaining QA, production deployment and explicit launch approval. Security measures added by #51 and production gates documented by #52 are not a public deployment authorization.


## Scope and status

**Earlier accepted increment:** PR #41 merged `9b76771` (CI 44582546867; wire-contract and facade rejection tests). Owner terminal audit verified `day4-final-20261119-153020.dump`, full restore to empty database, two sessions, four healthy services at `9b76771`, 27 GiB root free and 12 GiB RAM available; Continue confirmed. PR #42 merged `910b354` (exact approved `2bc43da`, [CI 44590534060](https://github.com/AlexandroLeao/ami-108/actions/runs/44590534060): 206 tests, 100 API/35 web/71 Python, four migrations, all 12 artwork hashes). Owner approved localized content advisory and spoiler-free Extras with nonprofit statement; no changes to story, artwork, rules, API, AI or database. Port 3000 frontend update and pinned-model reactivation verified (see live evidence below). 16+ is provisional editorial guidance, not a formal rating. All four release issues remain open.

The owner approved the entire five-chapter campaign, desktop/mobile, and requested no narrative, artwork, layout or mechanics changes. Accepted campaign runtime is PR #38 merge `7ae614d`; #41 reconciled contracts; PR #42 merged `910b354` after owner approval of the new warning and Extras. This is a release preparation checklist, not a claim of production readiness. Repository remains private and the mandatory cost budget is R$ 0.

| Check | Evidence / status |
| --- | --- |
| Campaign regression | Exact approved head `817aa5d`, [CI 44550503677](https://github.com/AlexandroLeao/ami-108/actions/runs/44550503677): 100 API, 30 web, 71 Python tests, four migrations, lint/types/build, full HTTP campaign and twelve original image hashes. Owner desktop/mobile preview reached credits. |
| Durable state | PostgreSQL integration: session isolation, restart, concurrency, idempotent receipts, F1/F2/F3, three checkpoints, immutable consultation slots and chapter replay. Owner confirmed port 3000 saves resumed. |
| Local API contract | PR #41 merged `9b76771`; CI 44582546867 passed focused built-HTTP projection/result shape and facade rejection checks with reconciled OpenAPI. Not a complete schema conformance audit. |
| Existing security controls | Random 32-byte session capability, digest stored, provisional 30-day expiry, HttpOnly/SameSite=Lax and Secure on HTTPS facade, current-only image authorization, strict mutation fields, origin check, 2048-byte facade JSON limit, private/no-store. Internal AI bearer token and 8192-byte request limit; no browser route to provider. DB has no published port; local web/API/AI ports bind loopback. |
| Controlled AI | Prior real-provider evaluation 81/82 validated, 21/24 distinct RANDOM options; live 10/10, cached slots unchanged, safe fallback. Current VM reactivated with 10/10 preflight and 10/10 live-service direct regression; API generation enabled. No newly generated gameplay receipt in the latest log. BOAR is authored only. |
| Dependency advisories | PR #45 records baseline scans; #46 merged `7ef0bf1` after CI 44596237140 (212 tests). PR #48 merged `f89c342` with scoped deepmerge-ts 8.0.2 override; both JS audits zero known, prior Python scan zero known. Exact CI 44598068478 and main CI 44598507917 green; owner installed API/web at `f89c342`. See [dependency audit](dependency-security-audit.md). OS/image and production security still open. |
| Production security | Open: production-mode routing and trusted origin, rate limits/quotas, ingress connection limits, session retention policy/cleanup, security headers, TLS, private network/secrets, monitoring and deployment review. Dev preview must not be exposed as production. |
| Accessibility | Owner approved desktop/mobile appearance; keyboard/focus, reduced motion, screen-reader announcements, zoom and automated accessibility audit still need documented evidence. Preserve approved visual design. |
| Performance | Local model benchmark exists; collect current warm/cold request latency, resource use and mobile rendering evidence on actual hardware; no universal latency claims. |
| Release | #12 security/QA, #13 zero-cost deployment decision, #14 final docs and #15 explicit release approval remain open. License/asset distribution and visibility need owner decision. |

## Live evidence — November 19

Owner terminal audit: `910b354` web-only build 18.5 s, verified 112 KiB backup `pre-content-warning-20261119-184908.dump`, two sessions, four healthy services. Documentation #43 merged `a27f4da` (CI 44591593982). Pinned Ollama Qwen2.5:1.5b ID `65ec06548149`, internal-only network/no published model ports, 3 GiB limit. Preflight 10/10 (158–1773 ms), actual AI container 10/10 (157–1815 ms), both locales 5/5 in each pass, no timeout/invalid. API generation/token configured; verified `pre-ai-reactivation-20261119-185622.dump` (112 KiB), two sessions, all three health endpoints OK and owner confirmed port 3000. 11 GiB available RAM, 18 GB root free. Direct evaluator is not a new gameplay receipt or production capacity test.

## Security increment — November 19

Owner authorized merging validated engineering changes. PR #44 merged `2358ef4`, #45 `3207a88`, #46 `7ef0bf1`; exact CI for each green, #46 212 tests, four migrations, all 12 artwork hashes and full HTTP smoke. Owner isolated pnpm 10.15.1 lock regeneration at `ebee88b` reports zero critical/moderate, one high in both JS audit scopes. Cloud Shell remained on `a27f4da`, four healthy services and 18 GB disk free; no live rebuild or save change. The remaining Prisma advisory was subsequently resolved in PR #48; production protections remain release blockers.

## Latest live security and inference handoff — November 19

PR #48 exact `f69a373` passed [CI 44598068478](https://github.com/AlexandroLeao/ami-108/actions/runs/44598068478): 215 tests (100 API/44 web/71 Python), Prisma validate/generate, four migrations and up-to-date status, full campaign and 12 artwork hashes. Merged `f89c342`, main CI 44598507917 green. Owner installed API/web only (143 seconds build), verified private 119 KiB archive `pre-security-20261119-192956.dump` (checksum, list and full archive read), three sessions and zero pending generations before/after, migrations current and all health endpoints OK. Previous images retained. Initial API recreation omitted the inference flags/token; authored fallback remained available.

Owner recovered token privately from existing AI container, validated pinned Qwen2.5:1.5b ID 65ec06548149 on internal-only network, evaluated 10/10 (PT-BR 5/5, EN 5/5, 161–1919 ms, eight alternatives, zero timeout/invalid), persisted local inference configuration in ignored .env with restrictive permissions, and recreated only API. Final booleans generationEnabled and internalTokenConfigured both true; four healthy services, three health endpoints OK, three sessions, zero pending generations, 15 GB root free (88% used). No new gameplay receipt or owner Continue confirmation in this recovery transcript. Verify Compose resolution without inherited shell variables and exact token match without disclosure before future recreation. Do not rebuild the AI/model or prune the retained recovery images unnecessarily.

PR #49 merged `b48d35b` (exact CI 44598710033, main CI 44599594188 green); [browser accessibility/performance plan](accessibility-performance-qa.md) is documentation-only. Runtime remains `f89c342`; browser and measured performance evidence pending. No public deployment or paid resources.

## Browser response hardening candidate — November 19

Add Next.js baseline response headers: X-Content-Type-Options nosniff, Referrer-Policy no-referrer, Permissions-Policy disabling camera, microphone and geolocation, and remove Next.js X-Powered-By. Built HTTP smoke checks root, health, unauthorized view, cross-origin rejection and authorized artwork. No approved game or asset changes. Do not add frame restrictions to the Cloud Shell preview; CSP, frame-ancestors, HSTS and TLS policy require trusted production origin and actual deployment verification. These headers are not a production enablement switch or full security certification.

Owner confirmed existing Continue, Tab/Shift+Tab, Enter, Escape, 200% zoom and mobile. Fresh-shell Compose config checks passed (generation enabled, shared token matches, local provider/model/endpoint). Local health timing n=10 per endpoint: web min/median/max 3.17/3.73/49.65 ms, API 5.26/5.69/6.58 ms, AI 2.63/2.94/3.87 ms. 4 vCPU, 15 GiB RAM, 11 GiB available, 15 GB disk free; Ollama 1.914/3 GiB at idle snapshot. Not gameplay latency, browser rendering or production load. Remaining: screen-reader/reduced-motion and automated browser review, fresh gameplay receipt, production origin/routing, ingress/quotas, retention and deployment. Owner approved seven manual checks, not all accessibility criteria.

## Runbook for evidence

1. Verify local VM, backup integrity, exact git SHA, four migrations and restored Continue before tests; no restore over a nonempty DB. Use an isolated disposable test database for new regression runs.
2. Re-enable the previously approved pinned local provider only after checking memory, free disk, internal-only network, model ID and a 10-case direct regression. Record aggregate results, not tokens, cookies, prompts or save contents.
3. Run JS dependency audit against the frozen lockfile and Python audit against the locked dependency export (without modifying lockfiles). Record date, tool/version, exit code and advisory IDs; review dev versus shipped dependencies. Do not automatically upgrade or dismiss advisories without checking compatibility and rerunning regression. No paid scanners.
4. Run the built HTTP smoke and unit/integration suites in CI. Test invalid inputs, unauthorized assets, stale/duplicate commands, session isolation, origin rejection, no future facts, provider timeout and fallback. Never send real saves to CI.
5. Check actual desktop/mobile and keyboard navigation, focus visibility, reduced-motion preference, 200% zoom and screen-reader labels. Record findings and distinguish automated results from manual review.
6. Record performance with the approved hardware, browser viewport, configuration and sample size; no production capacity claim from Cloud Shell.
7. Before any public hosting, complete production hardening and confirm verified zero mandatory cost; no cloud resources, billing or public visibility changes without owner authorization.

## Content advisory and release classification

Owner authorized a PT-BR/EN content warning before New game (violence, blood, strong language, horror); 16+ is a provisional editorial recommendation, not an official classification or age-verification gate. No date of birth or additional personal data collected. Extras makes the warning accessible and identifies AMI-108 as an original non-profit project. Owner accepted final preview; CI 44590534060 passed five new warning tests and all existing checks (206 total). Keyboard/accessibility release audit remains separate. For release in Brazil, consult the [current MJSP guide, 5th edition (2025)](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/paginas-classificacao-indicativa/guia-de-classificacao), [games/apps guidance](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/paginas-classificacao-indicativa/jogos-e-apps) and [Portaria MJSP 1.048/2025, arts. 5 and 43–50](https://bibliotecadigital.mj.gov.br/bitstream/1/15993/2/PRT_GM_2025_1048.pdf). Article 45 specifies IARC or authorized self-classification for digital-only distribution; article 46 allows prior analysis. Free distribution is not automatically exempt. Review the complete game and all interactive elements, appropriate procedure for standalone web distribution, required symbols/descriptors and any applicable age-assurance obligations before public release. No official symbol or certificate has been claimed; the local warning is not a substitute for those requirements.

## Known release blockers

- Local preview is intentionally gated by `AMI_DEV_PREVIEW=1`; production entry point and enforcement are not yet implemented.
- No production rate limiter or session cleanup/retention job has been evidenced; the 30-day expiry is provisional.
- PR #44 merged `2358ef4` after exact CI; 2048 raw-byte streaming bound, 413 for oversize and 400 for failed reads. PR #47 merged `5c95656` and adds a 10-second total body-read deadline (408, no upstream forwarding) with focused tests. It does not limit ingress header time, concurrent connections or requests buffered before the handler; production ingress and rate limits remain open.
- Final Day 4 archive/checksum, restore, live frontend installation and pinned inference reactivation verified.
- Complete private source synchronization, final portfolio and release decisions remain tracked separately.

This document records the review of the current source and existing test evidence. It does not certify security, deployment, accessibility or performance.
