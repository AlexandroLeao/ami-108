# Release QA and security evidence — AMI-010

## Scope and status

**Latest accepted increment:** PR #41 merged `9b76771` (CI 44582546867; wire-contract and facade rejection tests). Owner terminal audit verified `day4-final-20261119-153020.dump`, full restore to empty database, two sessions, four healthy services at `9b76771`, 27 GiB root free and 12 GiB RAM available; Continue confirmed. PR #42 merged `910b354` (exact approved `2bc43da`, [CI 44590534060](https://github.com/AlexandroLeao/ami-108/actions/runs/44590534060): 206 tests, 100 API/35 web/71 Python, four migrations, all 12 artwork hashes). Owner approved localized content advisory and spoiler-free Extras with nonprofit statement; no changes to story, artwork, rules, API, AI or database. Port 3000 frontend update and pinned-model reactivation verified (see live evidence below). 16+ is provisional editorial guidance, not a formal rating. All four release issues remain open.

The owner approved the entire five-chapter campaign, desktop/mobile, and requested no narrative, artwork, layout or mechanics changes. Accepted campaign runtime is PR #38 merge `7ae614d`; #41 reconciled contracts; PR #42 merged `910b354` after owner approval of the new warning and Extras. This is a release preparation checklist, not a claim of production readiness. Repository remains private and the mandatory cost budget is R$ 0.

| Check | Evidence / status |
| --- | --- |
| Campaign regression | Exact approved head `817aa5d`, [CI 44550503677](https://github.com/AlexandroLeao/ami-108/actions/runs/44550503677): 100 API, 30 web, 71 Python tests, four migrations, lint/types/build, full HTTP campaign and twelve original image hashes. Owner desktop/mobile preview reached credits. |
| Durable state | PostgreSQL integration: session isolation, restart, concurrency, idempotent receipts, F1/F2/F3, three checkpoints, immutable consultation slots and chapter replay. Owner confirmed port 3000 saves resumed. |
| Local API contract | PR #41 merged `9b76771`; CI 44582546867 passed focused built-HTTP projection/result shape and facade rejection checks with reconciled OpenAPI. Not a complete schema conformance audit. |
| Existing security controls | Random 32-byte session capability, digest stored, provisional 30-day expiry, HttpOnly/SameSite=Lax and Secure on HTTPS facade, current-only image authorization, strict mutation fields, origin check, 2048-byte facade JSON limit, private/no-store. Internal AI bearer token and 8192-byte request limit; no browser route to provider. DB has no published port; local web/API/AI ports bind loopback. |
| Controlled AI | Prior real-provider evaluation 81/82 validated, 21/24 distinct RANDOM options; live 10/10, cached slots unchanged, safe fallback. Current VM reactivated with 10/10 preflight and 10/10 live-service direct regression; API generation enabled. No newly generated gameplay receipt in the latest log. BOAR is authored only. |
| Dependency advisories | Pending current lockfile scans for JS and Python; record findings, severity, reachability and remediation. CI passes do not certify absence of vulnerabilities. |
| Production security | Open: production-mode routing and trusted origin, rate limits/quotas, body streaming bounds, session retention policy/cleanup, security headers, TLS, private network/secrets, monitoring and deployment review. Dev preview must not be exposed as production. |
| Accessibility | Owner approved desktop/mobile appearance; keyboard/focus, reduced motion, screen-reader announcements, zoom and automated accessibility audit still need documented evidence. Preserve approved visual design. |
| Performance | Local model benchmark exists; collect current warm/cold request latency, resource use and mobile rendering evidence on actual hardware; no universal latency claims. |
| Release | #12 security/QA, #13 zero-cost deployment decision, #14 final docs and #15 explicit release approval remain open. License/asset distribution and visibility need owner decision. |

## Live evidence — November 19

Owner terminal audit: `910b354` web-only build 18.5 s, verified 112 KiB backup `pre-content-warning-20261119-184908.dump`, two sessions, four healthy services. Documentation #43 merged `a27f4da` (CI 44591593982). Pinned Ollama Qwen2.5:1.5b ID `65ec06548149`, internal-only network/no published model ports, 3 GiB limit. Preflight 10/10 (158–1773 ms), actual AI container 10/10 (157–1815 ms), both locales 5/5 in each pass, no timeout/invalid. API generation/token configured; verified `pre-ai-reactivation-20261119-185622.dump` (112 KiB), two sessions, all three health endpoints OK and owner confirmed port 3000. 11 GiB available RAM, 18 GB root free. Direct evaluator is not a new gameplay receipt or production capacity test.

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
- Candidate bounds the facade body to the existing 2048-byte raw-byte limit during streaming, including absent Content-Length; oversized bodies are cancelled and return 413, stream failures return 400. CI and integration validation pending; slow-client timeouts and production rate limiting remain separate.
- Final Day 4 archive/checksum, restore, live frontend installation and pinned inference reactivation verified.
- Complete private source synchronization, final portfolio and release decisions remain tracked separately.

This document records the review of the current source and existing test evidence. It does not certify security, deployment, accessibility or performance.
