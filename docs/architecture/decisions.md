# Architecture decision records

## ADR-007 — Restore energy with memory (accepted November 17)

**Status:** owner approved, implemented for F1/F2 in PR #25 and F3 in PR #28. **Decision:** restoration atomically restores memory percentages and three energy bars; F3 also unlocks PERSONAL and sets all four indexes to 100%. Remove independent solar charging/dialogue. Preserve legacy SOL event/cursor compatibility without generating new SOL events. Consultation debit/checkpoint retry unchanged. No new assets or migration for F3.

## ADR-008 — Complete campaign without model authority (accepted November 19)

**Status:** implemented in merged PR #38 and owner-approved. CP-BOAR captures the unpowered ship before retrieval, with all memory indexes restored. Heat diversion precedes cell retrieval, gate opening and launch. BOAR uses fixed authored CORRECT; no RNG or provider call. Existing session/slot/checkpoint tables and transactional events reused. Ending and credits are distinct, no postcredits scene. Freeze approved narrative and art.

**Historical PR #38 status snapshot (superseded; current state: [release-readiness matrix](../release-readiness-matrix.md)):** All five chapters owner-approved (5/5, 100% of campaign, not release completion). Formal AMI issues 9/13 (69.2%) closed, plus #29; #8 and #11 completed. PR #38 merged `7ae614d` with exact approved head `817aa5d` (identical tree); [CI 44550503677](https://github.com/AlexandroLeao/ami-108/actions/runs/44550503677) passed 201 tests (100 API, 30 web, 71 Python), four migrations, lint/types/build and full HTTP smoke with 12 original artwork hashes. Owner desktop/mobile preview reached credits, PERSONAL unlocked, no consultation rows in final preview; main four services healthy and two sessions preserved. Story frozen. F1/F2/F3 atomically restore energy and memory; CP-DOG/RAT/BOAR and immutable slots persisted; CP-BOAR precedes E-SHIP and E-LAUNCH. BOAR always authored CORRECT, no model call. Expanded AI #35/#36 unchanged (24 bilingual RANDOM options, at most three sampled, 15/42/100 probabilities, 2s/2.5s deadlines); prior real benchmark 81/82, 21/24 distinct and live 10/10. Day 4 replacement VM restored verified archive `day3-final-ai-20261119-004433.dump` into empty DB at `fd0a906`, Continue confirmed; generation disabled temporarily. Owner subsequently confirmed the merged campaign installed at port 3000 and existing saves open normally; runtime `7ae614d` per installation procedure, final terminal audit pending. Documentation PR #39 merged `9c79913` after CI 44554390370 passed. Day 4 pause requested; final private backup and stopped-container evidence pending owner execution. On resume verify backup, VM and saves before re-enabling pinned Qwen2.5:1.5b (65ec06548149) on internal Ollama network. Private Master v1.14 / Script v1.12 plus later owner-approved amendments authoritative; source synchronization pending. #30 superseded and closed. Remaining #12 QA/security/accessibility, #13 zero-cost deployment, #14 final documentation and #15 release. No new migrations, art or paid resources. Historical notes below do not supersede this baseline.

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
