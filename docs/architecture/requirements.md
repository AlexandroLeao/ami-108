# Game requirements and traceability

## Current traceability

FR-10 restoration-linked energy implemented for F1/F2/F3. Chapters 1–4 passed automated transition/persistence checks and owner playtests. Controlled real inference demonstrated in isolated tests; accepted local installation uses fallback. Remaining full campaign, CP-BOAR, RANDOM diversity and provider activation, independent accessibility/security, deployment and release gates are open.

**Current accepted baseline — November 18, 2026:** Chapter 4 PR #28 merged at `176e8c1`, visual refinements #32/#33 merged at `23b165e` / `eb13de4`; owner approved desktop/mobile and exact final frontend. CI 44390775809, 44395236226 and 44396622036 passed. All twelve original artwork files retained. Port 3000 updated and Continue confirmed; four migrations current. Main documentation handoff #31 merged at `3e4a2fe`. Chapters 1–4 approved (4/5); 7/13 formal AMI issues closed. Private Master v1.13 / Script v1.11 plus subsequent explicitly approved changes are authoritative. Chapter 5 draft #30 catalog CI passed; integration pending. Real AI integrated and evaluated, currently disabled in local gameplay. #29 tracks diversity and activation. Final pause backup still owner-run. Historical notes below do not override this baseline.

---


**AMI-002 · specification, not implementation evidence**  
Original design sources: private Documento Mestre v1.9 and Roteiro Interativo v1.7 (November 15). Current private sources: v1.12 and v1.10 (November 17 cumulative addenda); narrative sections 1–11 and visual annexes remain unchanged except the approved opening presentation. Keep the private source text and reference sheets outside the repository. This specification contains internal game-rule details; review spoilers before making the repository public.

## Functional requirements

| ID | Requirement | Canonical anchors | Verification |
| --- | --- | --- | --- |
| FR-01 | Start or resume an anonymous game session, with a single linear campaign and five chapter cards. | A01-S01 through A05-S02; E-COMPLETE | E2E start, reload, complete both locales |
| FR-02 | Render a static 16:9 scene, authorized dialogue, ordered choices, textual interactions and chapter cards; image changes only when required. | CENA-01–12; Axx-Sxx | Component tests and visual playthrough |
| FR-03 | Preserve all localized authored dialogue, choices, consequences and fallback text; language changes do not change progression or reroll slots. | PT-BR / EN; stable scene + line IDs | Data completeness, parity, mid-run language change |
| FR-04 | Before E-JOIN, hide AMI diagnostics and energy; initialize three bars on E-JOIN. Before E-NAME, speaker remains unknown. | A01-S03; A02-S02 | State and projection tests |
| FR-05 | Only the current server-authorized action can advance the narrative. All mandatory events must precede the next scene. | Scene/transition matrix | Invalid, stale and out-of-order actions rejected |
| FR-06 | Three encounters in order; exactly four fixed choices per encounter. One safe, three lethal, no real-time combat. | CP-DOG / CP-RAT / CP-BOAR; DOG/RAT/BOAR-01–04 | Exhaustive 12 choices and terminal consequences |
| FR-07 | Consult only during active encounters; debit one bar, up to three per attempt. Zero energy does not block choosing. | Q-DOG, Q-RAT, Q-BOAR | Bounds, blocked consultation, zero-energy success |
| FR-08 | Determine CORRECT/RANDOM in NestJS; initial probabilities 15%, 42%, 100%. Persist category and result per encounter slot; no rerolls on retry or locale change. | BIO-02, F1, F3; Q-* | Seeded RNG boundary tests, cache and locale tests |
| FR-09 | After lethal choice, display specific consequence and death screen. Restore the checkpoint only on explicit return; preserve slot results and audit history outside rollback. | CP-* | All nine lethal choices; restored state and no extra inference |
| FR-10 | Mandatory F1, F2, F3 atomically restore approved percentages and three energy bars; PERSONAL remains locked until atomic F3. | F1/F2/F3 | Event order, duplicate handling and atomic unlock |
| FR-11 | Use deterministic authored flashbacks, including four headache/black transitions for David; no new images, sound, mechanics or inference. | MEM-D1–D4; FB-D1–D5 (D4/D5 continuous) | Transition and side-effect assertions |
| FR-12 | Reveal records and identities only at the specified milestones; restrict the current player projection and asset authorization. | E-NAME, E-ARCHIVE, E-PLANET, E-PARTNER, E-F3, E-FAMILY, E-BETRAYAL | Inspect API/client payloads, invalid asset requests |
| FR-13 | INTRO-RANDOM is fixed RANDOM, optional generation, no energy cost, cached once. Fixed authored reactions remain unchanged. | A01-S03/L33; INTRO-RANDOM | No debit, no reroll, localized fallback |
| FR-14 | AI only generates short permitted AMI utterances from authorized facts; validate or use authored localized fallback. Outcomes always deterministic. | CORRECT/RANDOM; Q-* | Real inference evidence, fake provider contract, malicious/invalid output tests |
| FR-15 | After each success, use the variant for the successful attempt only: A all RANDOM, B any CORRECT, C no consultations; boar B/C only. | DOG/RAT/BOAR success | Mixed and prior-failure histories |
| FR-16 | Directly install components/cell through fixed events; no inventory. Ship state changes only by approved events and choices. | F1/F2/F3; E-SHIP, E-LAUNCH | Idempotence, prerequisites and rollback tests |
| FR-17 | Finish through the authored ending and credits, returning to menu; no additional endings. | A05-S02; E-COMPLETE | Complete bilingual playthrough |

## Non-functional requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-01 | Reproducible installation from pnpm/uv lockfiles, Compose, migration, documented start/stop and CI. | Frozen installs, build, health checks; foundation verified in AMI-001 |
| NFR-02 | Persist authoritative state and slots in PostgreSQL; reject duplicate/stale commands and isolate sessions. | Transactional concurrency and reload tests |
| NFR-03 | Protect secrets and hidden content; server-side validation, same-origin session boundary, least privilege, rate limits, no sensitive payloads in logs. | Threat review, negative tests, Gitleaks/Trivy, authorized security scan |
| NFR-04 | No mandatory paid resource; explicit provider quotas, deadlines, bounded retries and fallback. Never confuse local simulation with real deployment. | Cost/terms review before provisioning; degraded-mode playthrough |
| NFR-05 | Responsive, keyboard-operable, readable UI with visible focus, semantic controls, localized labels and no color-only indicators. | React Testing Library, axe, keyboard and mobile playtests |
| NFR-06 | Use exactly the approved three colors in derived scene assets, preserve originals, verify 16:9 presentation, avoid layout shifts; measure Lighthouse and actual load times. | Asset manifest/checks, visual review, performance audit |
| NFR-07 | Structured operational logs with request correlation; no raw provider prompts, session secrets or private narrative dumps. | Log review, error-path tests |
| NFR-08 | OpenAPI contracts, modular code, regression tests and English technical documentation; no completion claims without evidence. | CI, contract checks, owner review |
| NFR-09 | Game remains playable without provider inference; distinguish application readiness from model availability. | Full fallback playthrough, timeout and failure tests |

Performance and accessibility thresholds are proposed for AMI-010 (WCAG 2.2 AA where applicable; Lighthouse target >=90 on an agreed representative run). These are engineering targets, not achieved measurements. Verify current tooling and limits before deployment.

## Explicit exclusions

No free movement, inventory, pickup systems, audio playback, animated sprites, real-time combat, hunger/thirst, free chat, procedural plot, additional endings, or new artwork. The 9 reference sheets are internal only; 12 scene assets are distinct from the 12 narrative scene IDs. Target duration 10–20 minutes is unmeasured until playtest.

## Day 1 implementation trace

AMI-002 merged in PR #17; AMI-003 merged in PR #18 after owner desktop/mobile approval and passing CI. FR-02/03 are partially demonstrated by the opening preview, not the full campaign. NFR-01 is verified for the development foundation. FR-04/05/11/13 have Chapter 1 domain, persisted-session and authorized-UI integration evidence in merged PRs #19/#20; FR-02/03 now also have a playable bilingual Chapter 1 subset. The owner accepted Chapter 1 presentation; final branch CI and post-merge CI passed. This does not establish full-campaign compliance, encounter behavior, real inference or independent accessibility/security acceptance; see [narrative engine](../narrative-engine.md). No requirement is marked fully implemented solely by a design or unit test.

## Release evidence

Track FR/NFR IDs in subsequent PRs and tests. AMI-004/005/006 cover the first two chapters, AMI-007 real inference and contingency, AMI-008/009 remaining campaign, AMI-010 full acceptance/security/accessibility, AMI-011/012 deployment/docs, AMI-013 final approval. Do not replace a missing implementation with a checked specification box.

Merged PR #22 extends the accepted local subset to Chapter 2: CP-DOG, four choices, resolved consultation cache, F1, SOL-01, MEM-D2/FB-D2 and E-NAME. PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes). Full-campaign, later encounters, real inference and independent security/accessibility acceptance remain pending. See [encounter engine](../encounter-engine.md). Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.
