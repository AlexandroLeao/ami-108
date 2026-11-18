# Architecture decision records

## ADR-007 — Restore energy with memory (accepted November 17)

**Status:** owner approved, implemented for F1/F2 in PR #25 and F3 in PR #28. **Decision:** restoration atomically restores memory percentages and three energy bars; F3 also unlocks PERSONAL and sets all four indexes to 100%. Remove independent solar charging/dialogue. Preserve legacy SOL event/cursor compatibility without generating new SOL events. Consultation debit/checkpoint retry unchanged. No new assets or migration for F3.

**Current accepted baseline — November 18, 2026:** Chapter 4 PR #28 merged at `176e8c1`, visual refinements #32/#33 merged at `23b165e` / `eb13de4`; owner approved desktop/mobile and exact final frontend. CI 44390775809, 44395236226 and 44396622036 passed. All twelve original artwork files retained. Port 3000 updated and Continue confirmed; four migrations current. Main documentation handoff #31 merged at `3e4a2fe`. Chapters 1–4 approved (4/5); 7/13 formal AMI issues closed. Private Master v1.13 / Script v1.11 plus subsequent explicitly approved changes are authoritative. Chapter 5 draft #30 catalog CI passed; integration pending. Real AI integrated and evaluated, currently disabled in local gameplay. #29 tracks diversity and activation. Final pause backup still owner-run. Historical notes below do not override this baseline.

---


Status: design merged in AMI-002 (PR #17). These decisions operationalize the approved stack and narrative without adding product scope. ADR-004 session expiry/retention and concrete integration details remain subject to implementation review. AMI-003 validated the local preview; PR #20 subsequently implemented and verified durable local Chapter 1 sessions. Production retention, rate limiting and deployment remain pending.

## ADR-001 — Authoritative modular NestJS API

**Context:** deterministic choices, energy, memory, checkpoints, spoiler gates and persistent progress must be enforced consistently.  
**Decision:** NestJS owns the state transition engine, catalog access, RNG, command receipts and database writes. Next.js renders only a current projection. Use a modular monolith rather than one service per feature.  
**Alternatives:** browser-only game state exposes outcomes and allows tampering; distributing the engine across services introduces unnecessary coordination.  
**Consequences:** more API tests and transactions, but a single authority and predictable behavior.

## ADR-002 — Isolate controlled AI behind FastAPI

**Context:** AI must generate AMI wording, not game rules. Python is an approved technology; provider availability is variable.  
**Decision:** typed internal requests, allowlisted fact retrieval by encounter and category, provider adapter, strict validation, authored fallbacks. NestJS alone selects category and authorizes requests. No model training/vector database or free chat.  
**Alternatives:** direct LLM calls from Next.js or NestJS simplify deployment but expose or conflate provider and domain concerns; fallback-only does not meet the real inference goal.  
**Consequences:** HTTP failure/timeout handling and contracts are required. Real inference must be demonstrated, while provider outage must not prevent campaign completion.

## ADR-003 — PostgreSQL and idempotent command processing

**Context:** retries, duplicate requests, concurrent tabs and checkpoint rollback can cause extra debits, rerolls or inconsistent progress.  
**Decision:** versioned state, transaction boundaries, unique receipts and slot constraints; checkpoint snapshots restore only reversible gameplay state. Reserve/finalize inference outside long transactions, deadline-bound recovery using fallback.  
**Alternatives:** localStorage or in-memory state are not durable/authoritative; event sourcing adds unnecessary complexity.  
**Consequences:** Chapter 1 uses an additive session/receipt migration, JSON progress and row locks with real PostgreSQL integration tests. PR #22 adds the CP-DOG snapshot, resolved slot rows and real PostgreSQL duplicate-debit/retry tests; later snapshots, provider reservations and further race-condition tests are required; keep a simple audit history rather than full event sourcing.

## ADR-004 — Anonymous scoped session and same-origin facade

**Context:** the player needs resume without a signup requirement. Hidden content and session mutations must be protected.  
**Decision:** opaque high-entropy capability, HttpOnly secure cookie, server-side digest, same-origin Next.js proxy and Origin checks, per-session authorization. Merged PR #20 implements this for local Chapter 1 with 32 random bytes, SHA-256 digest, 30-day absolute expiry, SameSite=Lax and Secure on HTTPS. Final expiry/cleanup, rate limits and production origin policy remain AMI-010. No account/password system for this MVP.  
**Alternatives:** public session IDs are not credentials; JWT/accounts add complexity without a current product requirement.  
**Consequences:** browser-specific resume unless an explicit future transfer feature is approved; test cross-session and CSRF protection.

## ADR-005 — Server-only narrative and gated assets

**Context:** future identities, correct choices, private reference sheets and later illustrations can spoil the story.  
**Decision:** store catalog, choice outcomes, approved fallback and reveal gates server-side. Return only current allowed view and actions. Serve authorized image bytes with private/no-store caching; no future art in Next public assets. Keep source documents/reference sheets outside the repo.  
**Alternatives:** static public asset paths and complete client-side narrative are not secure against inspection.  
**Consequences:** additional authenticated image serving; authorized players may save already-viewed images. Source visibility must be reviewed before public release; access controls cannot protect spoilers in public source history.

## ADR-006 — Zero mandatory cost and reproducible local-first development

**Context:** R$0 mandatory service budget, cloud/provider limits, Codespaces unavailable.  
**Decision:** Compose and GitHub Actions first; Google Cloud Shell for manual validation. Keep optional Codespaces configuration. Use external provider/hosting/AWS only after verifying free eligibility, quotas, data policy and owner approval. Document simulation versus real deployment.  
**Alternatives:** paid infrastructure or permanently running a Cloud Shell VM are not approved.  
**Consequences:** public demo availability depends on verified free resources; keep reproducible local execution, no scope reduction to meet a date.

Day 2 implementation evidence: PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes). No new ADR, stack or deployment decision; production retention/rate limiting and real inference remain pending.
