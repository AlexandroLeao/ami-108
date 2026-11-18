# Proposed API contracts

## Current contract status

Existing game commands and same-origin facade support Chapters 1–4, DOG/RAT, CP-DOG/CP-RAT, F1/F2/F3 and Chapter 3/4 replay. Chapter 4 card has CONTINUE; Chapter 5 card is the boundary. Presentation cues and text animations do not mutate state. PR #24 implements authenticated opt-in internal generation, bounded request/result validation and persisted reservation/receipt audit; default fallback remains. OpenAPI files below are design contracts; final runtime reconciliation remains #14. Chapter 5/BOAR not routed yet.

**Current accepted baseline — November 18, 2026:** Chapter 4 PR #28 merged at `176e8c1`, visual refinements #32/#33 merged at `23b165e` / `eb13de4`; owner approved desktop/mobile and exact final frontend. CI 44390775809, 44395236226 and 44396622036 passed. All twelve original artwork files retained. Port 3000 updated and Continue confirmed; four migrations current. Main documentation handoff #31 merged at `3e4a2fe`. Chapters 1–4 approved (4/5); 7/13 formal AMI issues closed. Private Master v1.13 / Script v1.11 plus subsequent explicitly approved changes are authoritative. Chapter 5 draft #30 catalog CI passed; integration pending. Real AI integrated and evaluated, currently disabled in local gameplay. #29 tracks diversity and activation. Final pause backup still owner-run. Historical notes below do not override this baseline.

---


The two OpenAPI 3.1 JSON documents are design contracts, not generated runtime specifications. The bootstrap health endpoints, isolated development preview asset and local Chapter 1 game routes are implemented in merged PR #20 (`3cf942a`); merged PR #22 extends these routes through Chapter 2. The remaining campaign and AI contracts remain proposals. Implement and verify against these contracts incrementally in AMI-004–007; adjust with reviewed ADRs when necessary.

- [Game API](game.openapi.json): session creation/resume, current projection, commands and protected asset.
- [AI internal API](ai.openapi.json): authorized generation request and candidate result/fallback signal. Never expose to the browser.

## Implementation boundary

The Chapter 1 baseline implements POST session, GET view, POST commands, PATCH locale and GET asset through the local same-origin facade. PR #22 uses the same routes for Chapter 2; checkpoint/slot rows and receipts are committed atomically. Session ownership, row-locked receipt transactions, strict input validation, bounded history and protected current-step art are implemented. CONSULT, CHOOSE and RETRY are implemented in the accepted Chapter 2 subset; later encounters/action kinds, pending inference, production rate limits and deployment remain proposals. See [narrative engine](../narrative-engine.md).

## Conventions

- Same-origin facade on Next.js; internal NestJS API routes use the same shapes. Use server-generated opaque session capability; no session secret in JSON or URL. The local session cookie is implemented as specified in ADR-004, with a provisional 30-day expiry.
- Every mutation has a UUID commandId and expectedRevision (except session creation). Check duplicate receipts before stale revision; identical retry returns its recorded outcome/current authorized view, conflicting payload returns 409. While generation is pending, poll the current view or retry the identical command; conflicting actions return 409.
- PREVIOUS reviews all reached Chapter 1 presentation from L02 through the Chapter 2 handoff, including already-applied events; no event replay or authoritative progress rollback. Commands are allowed only if listed by the current projection; client sends an action ID, not a target scene, outcome, energy, fact or category. Server projects localized current text, image URL, available actions and AMI diagnostics only from the visible E-JOIN beat onward; review of earlier beats hides diagnostics without changing stored state. The Chapter 2 handoff now exposes CONTINUE and PREVIOUS; the Chapter 3 card exposes CONTINUE and PREVIOUS; the Chapter 4 boundary exposes PREVIOUS only. ENCOUNTER projects legal CONSULT/CHOOSE actions, DEAD exposes the consequence and explicit RETRY; no outcomes or cache contents are serialized before selection. Narration/information flags and presentation cues do not mutate game rules.
- HTTP 400 invalid input; 401 missing/invalid session; 403 disallowed action; 409 stale revision/conflict; 429 rate limit; 503 unavailable. Do not include stack traces or future facts. Return localized user-facing messages from client error mapping.
- AI request is server-to-server; validate question/category/fact combination against the server-side allowlist and reject unsupported content. Provider only receives allowed context; output must be checked against authored facts and fallback. A failed/untrusted candidate never determines gameplay.
- Asset authorization uses the session and current visible step; the required key query parameter is a cache discriminator, must exactly match the current asset and cannot select a different image; image response is private/no-store. Never send a full catalog or solution key in any response.
- The local facade uses a 10-second upstream timeout and rejects cross-origin mutations. Rate limits, retention cleanup, expiry policy and production deployment remain unverified. Local integration only: do not enable the development flag in production.

Chapter replay uses the existing POST commands endpoint with server-validated `CHAPTER/RESTART/N`, normal session capability, expected revision and idempotency receipt. The projection includes `chapters` (reached number/title only); no locked chapter title or snapshot/cache data is exposed. Replays preserve highest reached chapter and slot cache; restart replaces the current resume position. The `startle` cue is presentation-only.

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

The existing API contract is unchanged by this documentation update. Chapter 3 is still the development boundary; provider reservation/pending inference and later encounters are not implemented.
