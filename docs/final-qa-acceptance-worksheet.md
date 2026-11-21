# Final QA and release acceptance worksheet

**Status:** evidence checklist, not a WCAG, security or public-release certificate. The accepted game runtime is `14ea583`; the latest seven-session private backup and paused VM state are owned by [release readiness](release-readiness-matrix.md). No changes to player saves or the frozen game are authorized by this worksheet.

## Accepted functional evidence

- The approved five-chapter PT-BR/EN campaign, three encounters and twelve original scene assets passed the accepted **221-test PR #53 CI** and built-campaign/artwork smoke. These tests use disposable state, not the owner's real saves.
- Previous-VM pinned Qwen2.5:1.5b direct authenticated evaluation passed **10/10 bilingual cases** after an earlier first-load 8/10 with two safe timeouts; the owner approved private desktop/mobile gameplay. **This does not demonstrate live model residency on the last replacement VM**, where inference was OFF.
- After controlled recovery on the replacement VM, the owner confirmed **Continue** on private Web Preview port 3000. The user also reported **keyboard-only menu/dialogue/button operation** and **200% browser zoom usability** passing. The exact browser, OS, device and locale for those two checks were **not recorded**.
- The latest private backup was fully read, checksum-verified and preserves **7 saved sessions / 0 pending / 4 finished migrations**. The game was safely paused without deleting volumes. The authoritative filename is recorded in [release readiness](release-readiness-matrix.md).

## Protected hosted functional QA — November 21, 2026

The owner reported completing all five approved chapters and the ending, in PT-BR and EN, on desktop and mobile in the SSO-protected Vercel Preview of commit `eb3994358c41117a46c602fc1748179af7793758` ([PR #96](https://github.com/AlexandroLeao/ami-108/pull/96)). Scene artwork, dialogue progression, refresh and saved-game resume were observed working. This resolves the reported first-image blockage **for the owner's tested sessions**, not an independent automated E2E audit or a browser security certificate.

The exact browser versions, devices, response codes, timing samples and screenshot traces were not recorded. The optional hosted AI generation was **OFF**, so this does not validate Groq integration. Both production and generic Preview gameplay are OFF; the game is only temporarily enabled on the SSO-protected QA branch. See [release readiness](release-readiness-matrix.md) for the current release boundary.

## Real Groq integration acceptance — November 21, 2026

The owner manually ran [GitHub Actions 44915899967](https://github.com/AlexandroLeao/ami-108/actions/runs/44915899967) on merged `main`; the isolated, ephemeral NestJS/FastAPI/Groq/PostgreSQL job completed **2/2 PASS** (PT-BR: 1455 ms; EN: 1119 ms). Both tests required stored `VALIDATED` receipts, a single consultation slot and idempotent replay; temporary session cleanup was verified. No Vercel/Neon hosted inference was exercised. Hosted `AMI_AI_GENERATION=0` remains OFF; the user's existing hosted-game acceptance used authored fallback. Details and limitations belong to the [Groq evaluation](groq-inference-evaluation.md).

## Hosted Groq and owner accessibility acceptance — November 21, 2026

After a branch-specific Sensitive Groq key was configured, the latest [SSO-protected Vercel QA deployment](https://vercel.com/alexandroleaos-projects/ami-108/6eNVpUWNsMSGMjUU4G9kwPZNjaQu) reached READY. The owner reported gameplay worked and the short accessibility tests passed. A read-only Neon Preview query then found **one PT-BR `VALIDATED` receipt** at `15:46:35.999Z`, **zero pending**, and six preserved sessions. This establishes real hosted game-to-Groq persistence in PT-BR; it does **not** establish hosted EN `VALIDATED`, an independent WCAG audit, multi-user rate/concurrency limits or production readiness. Generic Preview and Production remain with generation OFF. Evidence and limitations are owned by the [Groq evaluation](groq-inference-evaluation.md).

## Accessibility and browser checks — issue #12

Record a test as **passed only for the actually tested configuration**. Owner-reported checks can be accepted as observations without fabricating browser, assistive technology or per-language coverage. Use a separate disposable browser profile for new-game/destructive tests; preserve the owner's real saves.

| ID | Test | Available evidence | Still required |
| --- | --- | --- | --- |
| A01 | Keyboard menu, Tab/Shift+Tab, Enter/Space and visible focus | Owner reported keyboard menu PASS; locale unspecified | Record any missing focus-state coverage and locale-specific results if required |
| A02 | Warning/Extras/Language/Pause modal focus, Escape and Back | NOT RUN as complete modal/focus-trap suite | Manual assistive-technology/focus checks |
| A03 | Dialogue, choice navigation and current-image gating | Owner reported keyboard dialogue/buttons PASS; locale unspecified | Per-locale focus/arrow/gating observations |
| A04 | Screen reader announces headings, dialogue, errors and language | Owner reports requested assistive-technology smoke tests passed November 21; no logs, specific reader/version or per-language coverage recorded | Independent or more detailed per-locale narration/semantic focus checks only if intended audience demands them |
| A05 | Reduced-motion readability, transitions and credits | Owner reports the requested short reduced-motion check passed November 21; no device/OS details recorded | No full credits, per-browser or stress test claim |
| A06 | 200% browser zoom with accessible controls | Owner reported PASS; locale/viewport unspecified | Screen-size/locale-specific clipping checks if release requires |
| A07 | Mobile portrait/landscape usability | Owner completed hosted gameplay on mobile and desktop in both locales on November 21; orientation unspecified | Full mobile accessibility, portrait/landscape and assistive-technology coverage |
| A08 | Current scene alternative text and retry/recovery | NOT RUN | Image-error/alt-text checks on test data |
| A09 | Continue and locale-switch preservation | Continue owner-verified on restored VM; tested locale unspecified | Controlled locale-switch and session invariants |
| A10 | Automated accessibility checks in menu/modal/game states | NOT RUN | Document scan tool, version, results and remaining manual cases |

## Performance and security evidence — issue #12

| Gate | Current status | Required proof |
| --- | --- | --- |
| UI cold/warm timings, image loading and credits | NOT MEASURED on replacement VM | Browser/device/network, CPU/RAM, repeat samples and median/range; no sensitive HAR files |
| AI inference and fallback | Runner 2/2 PT-BR/EN live Groq acceptance and **one hosted PT-BR `VALIDATED` receipt** from Vercel-backed Neon Preview. Offline 401/403/429/timeout fallback tests passed. | Hosted EN `VALIDATED` receipt remains unobserved; no proven real 429 exhaustion, quota load, public multi-user concurrency or Production activation |
| Dependencies, licenses, container images and OS | Historical JS/Python dependency scans and CI checks | New dated scans, advisory triage, OS/container and license review |
| Session cookies, origin/Host proxy and private assets | Owner's authenticated hosted QA confirmed gameplay and image visibility, but did not establish hostile-request controls or independently capture HTTP statuses | Test trusted HTTPS ingress, CSRF/Host rejects and asset isolation with disposable state |
| Rate limiting, anonymous creation, model concurrency, retention and restore | NOT APPROVED FOR PUBLIC DEPLOYMENT | Bounded synthetic load, abuse policy, monitoring, privacy and recovery plan |

The [browser QA plan](accessibility-performance-qa.md) owns test methods. The [production-security checklist](architecture/production-security-gates.md) owns deploy-specific controls. The [dependency audit](dependency-security-audit.md) owns historical advisory evidence. CI's private-file-name guard does **not** inspect every secret embedded in content.

## Release acceptance — issues #13–#15

- [ ] **#13 Hosting:** owner approves an actual architecture with mandatory cost R$ 0 (or separately agrees to a cost exception); actual TLS/ingress, PostgreSQL persistence, secrets, quotas and model-data privacy are verified.
- [ ] **#14 Documents:** privately reconcile the Day 3 Master v1.14 and Interactive Script v1.12 to the owner-approved final Chapter 5 and later explicit amendments. The private draft addendum remains **unapproved**.
- [ ] **#15 Rights and release:** verify source/art distribution license, applicable Brazilian classification and whether repository visibility can change; obtain explicit tag/public-launch approval.
- [ ] **#12 QA/security:** satisfy or explicitly scope the remaining accessibility, measured-performance, public threat/abuse and dependency-image gates.

**Current decision:** owner-accepted personal, noncommercial, SSO-protected gameplay and accessibility smoke with one **persisted hosted PT-BR Groq `VALIDATED` receipt**. A hosted EN receipt and bounded controls for any additional players remain pending. Existing editorial `16+` warning remains unchanged and is not an official classification. Private source reconciliation is separate editorial maintenance; public-release/security gates apply to any wider distribution. No Production game/AI activation or `v1.0.0` tag is authorized.
