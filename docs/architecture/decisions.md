# Architecture decision records

**Type:** architecture decision reference. Accepted decisions retain their original scope and rationale. Later hosting, Groq activation and production quota work are documented in their own verified rollout records rather than retroactively changing the decisions. See [release readiness](../release-readiness-matrix.md) and [production security controls](production-security-gates.md).

## Decision index

| ADR | Decision | Status | Primary evidence |
| --- | --- | --- | --- |
| [001](#adr-001--authoritative-modular-nestjs-api) | NestJS as gameplay authority | Accepted; implemented | PRs #17, #20, #38 |
| [002](#adr-002--isolate-controlled-ai-behind-fastapi) | Bounded AI service | Accepted; opt-in implemented | PR #24 |
| [003](#adr-003--postgresql-and-idempotent-commands) | Durable commands and sessions | Accepted; implemented | PRs #20, #22, #24 |
| [004](#adr-004--anonymous-scoped-sessions) | Capability cookie and same-origin facade | Implemented in public game; not a complete security certification | PRs #20, #48 |
| [005](#adr-005--server-only-narrative-and-gated-assets) | Authorized projections and assets | Accepted; implemented | PRs #20, #38 |
| [006](#adr-006--local-first-zero-mandatory-cost) | Development infrastructure | Accepted for private development | PR #17 and GitHub CI |
| [007](#adr-007--restore-energy-with-memory) | Atomic memory/energy restoration | Accepted; implemented | PRs #25, #28 |
| [008](#adr-008--complete-campaign-without-model-authority) | Deterministic finale | Accepted; implemented | PR #38 |
| [009](#adr-009--optional-cloudflare-inference-without-gameplay-authority) | Optional Cloudflare Workers AI connector | Proposed; OFF by default | Isolated connector PR (no account/network use) |
| [010](#adr-010--free-first-groq-structured-inference-as-optional-provider) | Free-first Groq structured inference | Accepted and active in Production | Runner/Preview acceptance and Production receipts |

## ADR-001 — Authoritative modular NestJS API

**Status:** Accepted; implemented for the five-chapter game, including the public portfolio deployment.

**Context:** Choices, energy, memory, checkpoints, spoiler restrictions and persistent progress require one authoritative state machine.

**Decision:** NestJS owns transitions, catalog access, probability draws, receipts and database writes. Next.js renders only the current authorized projection. Use a modular monolith rather than distributing each game feature into its own service.

**Alternatives considered:** Browser-only state exposes outcomes and permits tampering; a separate service per feature adds coordination without demonstrated need.

**Consequences:** Stronger transaction and integration-test requirements, but a single rule authority. Production deployment still requires ingress and security review.

## ADR-002 — Isolate controlled AI behind FastAPI

**Status:** Accepted; implemented with authenticated, bounded Groq inference in Production and optional local fallback-capable inference.

**Context:** AMI wording may vary, but narrative facts, encounters and probabilities must remain deterministic; model availability and latency vary.

**Decision:** Use typed FastAPI requests, finite allowlisted fact retrieval, strict response validation, bounded provider calls and localized authored fallback. NestJS alone chooses the permitted category and may authorize generation; no free chat, model training or vector database is required.

**Alternatives considered:** Calling a provider from the browser or unbounded API prompts would expose private facts and conflate model text with gameplay authority. Fallback-only would miss the accepted local inference goal.

**Consequences:** Internal authentication, network isolation, deadline recovery and compatibility tests are necessary. The previous VM's 10/10 model acceptance is **historical**; it does not prove a model is resident on the replacement VM.

## ADR-003 — PostgreSQL and idempotent commands

**Status:** Accepted; implemented with five tracked additive migrations, including the public daily usage table.

**Context:** Retries, concurrent tabs and checkpoint replay must not double-charge energy, change a previously selected consultation or corrupt state.

**Decision:** Use PostgreSQL/Prisma transactions, revision checks, unique command receipts and immutable slots. Checkpoint rollback is limited to reversible state; model inference is reserved/finalized outside prolonged database locks with deterministic timeout fallback.

**Alternatives considered:** Browser local storage and in-memory progress lack server authority/durability; complete event sourcing would add complexity beyond the game's requirements.

**Consequences:** Persisted relational/JSON state and transactional integration tests; concurrency and production data retention remain independent release gates.

## ADR-004 — Anonymous scoped sessions

**Status:** Implemented in the public portfolio game; independent security, retention and scale assessments remain limited.

**Context:** Players need a resumable game without mandatory account registration, while hidden scenes and mutations must remain private to the session holder.

**Decision:** Use a high-entropy opaque capability, stored by digest server-side and carried via an HttpOnly SameSite cookie, with Secure on HTTPS. A same-origin Next.js facade validates Origin, current session and allowed actions. The local session expiry policy is provisionally 30 days.

**Alternatives considered:** Public session IDs are not credentials; full accounts/JWT would add a feature outside approved scope.

**Consequences:** Browser-specific Continue and no built-in cross-device transfer. Trusted ingress, host/proxy checks, quotas, cleanup and privacy are **not certified for public hosting**.

## ADR-005 — Server-only narrative and gated assets

**Status:** Accepted; implemented for the five-chapter campaign and current-asset access in Production.

**Context:** Future revelations, correct choices and unreleased reference material must not appear in client payloads.

**Decision:** Keep authoritative catalog, outcomes and fallbacks on the server. Return only the allowed scene projection and current actions. Serve original images through authorized current-scene routes with private/no-store caching; do not place future artwork in public Next.js assets.

**Alternatives considered:** Fully client-side catalogs and public static assets would expose future content.

**Consequences:** More server-validated asset reads and tests. Previously viewed art can be saved by a legitimate player; source/public distribution requires separate rights review.

## ADR-006 — Local-first zero mandatory cost

**Status:** Accepted for **development**, not a hosting-provider decision.

**Context:** Mandatory service cost target is R$ 0, and cloud free-tier eligibility and quotas vary by account and service.

**Decision:** Use Docker Compose and Google Cloud Shell for private development/preview and GitHub Actions for CI; evaluate hosting and infrastructure-as-code separately. No production VM, cloud account, external model provider or billing commitment is authorized by this ADR.

**Alternatives considered:** Paid hosting and persistent use of an interactive Cloud Shell session were rejected for the present development scope.

**Consequences:** Cloud Shell's temporary VM requires private backup and restore procedures. Public Vercel/Neon hosting was subsequently accepted under closed [issue #13](https://github.com/AlexandroLeao/ami-108/issues/13), without changing the original local-development decision.

## ADR-007 — Restore energy with memory

**Status:** Accepted November 17, 2026; F1/F2 in PR #25 and F3 in PR #28.

**Context:** Independent solar-energy interactions created gameplay inconsistency with approved memory restoration.

**Decision:** F1/F2/F3 atomically restore memory and three energy bars. F3 unlocks PERSONAL and brings all four memory indices to 100%. Retire new independent solar charging actions while preserving previously saved legacy SOL cursor compatibility.

**Alternatives considered:** A separate charging minigame or interaction was not approved; removing compatibility would risk old saves.

**Consequences:** Recovery must be idempotent and transactional; consultation debits and checkpoint retry remain unchanged, without extra art or migrations for F3.

## ADR-008 — Complete campaign without model authority

**Status:** Accepted November 19, 2026; implemented in PR #38.

**Context:** The boar encounter and final escape must remain deterministic and work even if inference is unavailable.

**Decision:** CP-BOAR captures the unpowered ship before the cell is retrieved. Heat diversion precedes the cell, gate opening and launch. BOAR consultation is authored CORRECT, with no model call or RNG. Reuse existing session, checkpoint, slot and receipt tables. The ending and credits are distinct; there is no additional postcredits scene.

**Alternatives considered:** Generating correct tactics with an LLM would violate the deterministic gameplay contract; adding a new storage schema or ending would exceed owner-approved scope.

**Consequences:** Atomic replay and immutable-slot tests are required; the approved final narrative/art remain frozen. The public-release sign-off is **not** part of this ADR.

## ADR-009 — Optional Cloudflare inference without gameplay authority

**Status:** Proposed connector architecture, implemented behind a **disabled-by-default** opt-in. Live use, remote data disclosure, selected model and hosted deployment **not approved or tested**.

**Context:** The local Ollama/Qwen evidence is valuable for employment skills, but keeping a warm model resident on the temporary Cloud Shell VM is not sustainable. Demonstrating bounded inference through an independent cloud API can add applied FastAPI integration skills without changing the five-chapter game.

**Decision:** Reuse the existing `Provider` contract and immutable NestJS reservation/finalization and authored fallback. An optional, isolated FastAPI connector for Cloudflare Workers AI uses the provider's fixed HTTPS origin, strict account/token configuration, explicitly reviewed model identifier, a one-request/no-retry transport and at most three already-approved English candidate options for RANDOM. The only accepted output is an index mapped to the approved localized text. The adapter is OFF by default, and no account, token or remote model is supplied by the repo. Before live activation, verify Free-plan eligibility, model availability, token scope, privacy/retention and owner approval to send the small authorized options set externally.

**Alternatives considered:** Requiring a permanent Ollama host adds compute/disk cost, and arbitrary OpenAI-compatible URLs create SSRF, billing and data-disclosure hazards. Replacing NestJS validation with free-form prompting would violate the accepted gameplay guarantees. Cloudflare is a candidate, not an exclusive commercial commitment; Vercel AI Gateway remains an alternative after separate quota/privacy review.

**Consequences:** Keep local Ollama tests and baseline unchanged. Add mocked remote contract, invalid-index/timeout/quota/security tests; evaluate PT-BR/EN in a **new, explicitly authorized remote sandbox** and record real latency before enabling. Model deprecations and daily quota failures must fall back safely. No current inference uptime, public deploy, cost subscription or private narrative release is implied.

## ADR-010 — Free-first Groq structured inference as optional provider

**Status:** Accepted as a gated provider in [PR #80](https://github.com/AlexandroLeao/ami-108/pull/80) and subsequently enabled in the public Production deployment. Owner-accepted PT-BR/EN gameplay, persisted `VALIDATED` receipts and authored fallback are recorded in [release readiness](../release-readiness-matrix.md). The provider remains disabled by default in unconfigured/local environments.

**Context:** The owner requires working live inference to distinguish the AMI-108 portfolio project. The real Cloudflare Gemma 4 tests failed the authorized output contract (0/10), then a bounded one-call test failed with an invalid index; further repeated trials would waste time. The game must still complete without model availability. Free Groq GPT-OSS 20B supports constrained JSON Schema and fast text inference, within documented Free quotas.

**Decision:** Reuse the existing authenticated FastAPI `Provider` interface and NestJS game-authority boundary. An optional Groq adapter uses the fixed HTTPS `api.groq.com` endpoint, an explicit model allowlist, a secret key exclusively in server configuration, a 2-second timeout and no automatic retry. The model receives at most three already approved English utterances and can return **only one index in a required strict-JSON selection field**. The server must independently map the index to preapproved PT-BR/EN text. `AMI_AI_GENERATION=0` and a blank provider mode remain the defaults; HTTP 429 or any invalid response uses the authored fallback.

**Alternatives considered:** Continuing to adjust Gemma after exhausted owner-run evidence was inefficient; keeping a resident Ollama/Qwen server requires memory/disk capacity and possibly hosting cost; directly exposing an OpenAI-compatible API from the browser would leak credentials. Arbitrary third-party endpoints and unconstrained chat would exceed approved narrative authority.

**Consequences:** Offline negative-path, provider-only, runner 2/2 and protected hosted bilingual session-receipt evidence are in the [Groq evaluation](../groq-inference-evaluation.md). The samples do not establish sustained public quota, compliance, data retention or Production reliability. Selecting an authorized prewritten line is **real inference, not free-form narrative generation**. The public portfolio release was subsequently owner-approved under closed [issue #15](https://github.com/AlexandroLeao/ami-108/issues/15). No paid upgrade, gameplay authority or free-form dialogue is implied.

## Historical decisions and revisions

The original implementation proposals and dated Day 2 PR #22 evidence are retained in [development history](../development-history.md). Later decisions must use a new numbered ADR or explicit supersession link; do not silently change an accepted decision to fit an unapproved hosting design.
