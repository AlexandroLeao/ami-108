# Final QA and release evidence — November 20, 2026

**Status: WORKSHEET, not a release certificate.** Owner-approved local game runtime `14ea583` remains frozen. The last verified private pause preserved **7 sessions, 0 pending generations, 4 migrations** in `pause-ami108-20261120T005447Z-121510.dump` (182,626 bytes, full-read and SHA-256 PASS). The game/AI was stopped cleanly; new Cloud Shell runtime and persistence have **not yet been inspected today**.

## Accepted evidence

- All five chapters, two locales, twelve original scene illustrations and three encounters passed accepted gameplay/CI checks. Current `main` at start of this worksheet: `6bda027`, Python/TypeScript green, 29 Markdown files with 0 internal-link and 0 structure violations, full built-campaign smoke and 12 artwork hashes.
- Resident local Qwen2.5:1.5b passed ten authenticated direct PT-BR/EN cases at 1220–1711 ms; its earlier first-load 8/10 had two safe timeouts. Owner verified activation and normal fresh-game RANDOM variety on mobile and desktop in both languages. Not per-receipt telemetry or universal latency evidence.
- Original saved Continue works. Never clear the owner's session cookies or restore over the seven saved games.

## Browser and accessibility matrix — issue #12

Use the existing private preview only **after** a read-only environment preflight and safe resume. Existing save tests stay in the original browser; all new games in separate/private profiles. Record browser/OS/version, locale, viewport, screen reader/version, actual pass/fail, and a short reproduction note; avoid screenshots of cookies, secrets or spoilers.

| ID | Gate | PT-BR | EN |
| --- | --- | --- | --- |
| A01 | Keyboard-only menu: Tab/Shift+Tab, Enter/Space, visible focus | NOT RUN | NOT RUN |
| A02 | Warnings, Extras, Language and Pause dialogs: focus trapping/Escape/Back | NOT RUN | NOT RUN |
| A03 | Dialogue/choices: correct focus, arrows, image/action gate | NOT RUN | NOT RUN |
| A04 | Real screen reader speaks meaningful headings, dialogues, choices and errors | NOT RUN | NOT RUN |
| A05 | Reduced-motion setting: readable reveals, transitions and credits | NOT RUN | NOT RUN |
| A06 | 200% zoom: no clipping or unreachable controls | NOT RUN | NOT RUN |
| A07 | Mobile portrait and short landscape: visible text and navigation | OWNER FLOW PASSED; FULL A11Y NOT RUN | OWNER FLOW PASSED; FULL A11Y NOT RUN |
| A08 | Current scene image alt and retry/error recovery | NOT RUN | NOT RUN |
| A09 | Continue and locale switch preserve authorized progress | OWNER-OBSERVED; RECHECK AFTER RESUME | OWNER-OBSERVED; RECHECK AFTER RESUME |
| A10 | Automated accessibility audit in menu/modal/game states | NOT RUN | NOT RUN |

## Safe read-only backend evidence collection

Only **after** the exact accepted local runtime and healthy Web/API/AI/DB/model have been safely resumed (no restore into populated DB), use [read-only resumed QA metrics](../scripts/qa-readonly-resumed-metrics.sh) from the reviewed GitHub commit. It checks actual session/pending/migration counts (at least seven saved), model network and generation ON, takes five non-mutating HTTP health samples per endpoint and one Docker CPU/memory snapshot. It does **not** open a new game, request model generation, or create/delete/update saves. This is useful backend readiness evidence, **not** gameplay p95, screen-reader or public capacity certification. Do not run it before the safe-resume inspection, and stop on any mismatch.

## Performance and security — issue #12

| Gate | Status | Required actual evidence |
| --- | --- | --- |
| Device timing/cold-warm UI/images/credits | NOT RUN | Browser and network, CPU/RAM, viewport, repeat samples, median/range, no leaked HAR |
| Real screen-reader and zoom/reduced motion | NOT RUN | Device-specific observations and reproduced defects |
| JS/Python dependencies, licenses and container OS | HISTORICAL SCANS ONLY | New dated lockfile and image scans; triage, never auto-upgrade |
| Origin/Host/forwarded header, cookie/session abuse | SOURCE REVIEW ONLY | Test behind selected trusted HTTPS ingress with disposable DB |
| Rate caps, inference concurrency, retention and backups | PUBLIC RELEASE BLOCKED | Explicit policy and bounded synthetic test; never stress real saves |

Read the [existing a11y plan](accessibility-performance-qa.md) and [proposed production security gates](architecture/production-security-gates.md) for detailed cases. Automated green CI does not equal WCAG compliance or production security.

## Release-critical decisions — issues #13–#15

- [ ] #13: Choose and prove **R$ 0 mandatory cost** deployment with owner authorization, quotas/terms, TLS, isolation, secrets, recovery and sustainable capacity. Or explicitly accept **private-only completion** without public hosting.
- [ ] #14: Privately reconcile Master v1.14 and Interactive Script v1.12 with the accepted Chapter 5 and subsequent amendments; approve new source revisions without changing approved dialogue. The separate private addendum is **only a draft for owner review**.
- [ ] #15: Decide project/asset license, distribution permissions, applicable Brazilian content classification and formal public-release approval; do not change visibility or create `v1.0.0` based only on a target date.
- [ ] #12: Complete real browser a11y, measured performance and production threat/abuse testing.

**Decision status:** PRIVATE PLAYABLE GAME ACCEPTED; PRIVATE DOCUMENT SYNC PENDING; PUBLIC HOSTING NOT PROVISIONED; PUBLIC RELEASE NOT AUTHORIZED. Keep #12–#15 open until the actual evidence and owner decisions satisfy each acceptance criterion.
