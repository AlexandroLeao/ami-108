# AMI-007 — controlled inference foundation

## Current implementation boundary

The accepted runtime implements **optional** private Ollama generation behind authenticated FastAPI and NestJS reservation/finalization. NestJS owns allowed categories, finite fact/context IDs, deterministic probabilities, energy, checkpoint state and immutable receipts; FastAPI validates authorized context, applies strict output bounds and falls back to approved localized prose on provider failure. BOAR remains authored CORRECT and never calls the model.

The owner previously verified pinned Qwen2.5:1.5b in a separate, internal-only network, including an authenticated bilingual 10/10 evaluation. **The latest replacement VM was safely paused with Ollama absent and `AMI_AI_GENERATION=0`; there is no current live-inference claim.** See the [release checkpoint](release-readiness-matrix.md). No external model provider, training pipeline, vector database or free-chat product has been approved.

## Dated implementation history

> **Archived PR #38 snapshot:** [historical evidence](history-pr38-snapshot.md). For the latest verified seven-session pause and outstanding release gates, see [release readiness](release-readiness-matrix.md).

Historical development notes below are retained as evidence and do not override the accepted status.

November 17, 2026. Draft increment after accepted PR #22 (`76946f9`). Source: private Master v1.12 / Script v1.10; existing canon and fallback wording unchanged.

## Historical first foundation increment (PR #23)

- Strict Pydantic request/result types follow the proposed internal API. No free prompt, player identity, probability, energy, choice, or arbitrary fact text.
- Authenticated POST /internal/generate is disabled unless an internal capability is explicitly configured. Default service has no live provider; health behavior unchanged. No browser facade route, game integration, new dependency, credential, Compose change or external call.
- Exact question/category/fact-set retrieval, scoped to already implemented dog and free introduction. Q-RAT and Q-BOAR are accepted as known wire identifiers but rejected by the allowlist until their narrative gates are implemented.
- Injected asynchronous provider interface, deadline, no retry, sanitized fallback reasons. Strict first-increment validation permits only the existing canonical localized utterance; this is deliberately conservative, not a claim of flexible paraphrasing or real inference. Tests use a fake provider, never an external service. NestJS must own category, fact authorization, actual budgets, reservation and fallback.
- For unauthorized context, do not call provider. The service returns a fallback signal only; NestJS remains authoritative for authored fallback and persistence.

| Question | Category | Required fact IDs |
| --- | --- | --- |
| Q-DOG | CORRECT | DOG-VISION, DOG-HEARING, DOG-WAIT |
| Q-DOG | RANDOM | DOG-RECIPE |
| INTRO-RANDOM | RANDOM | INTRO-OCTOPUS |

## Historical next implementation gates (implemented by later PRs)

1. Review exact internal contract/authentication and add NestJS reservation/finalization with persistent immutable slot category/facts, deadline recovery, single charge, request ID, cache, provider budget, and stale attempt protection. Do not hold row locks across inference. No network retries after uncertain call. Keep existing fallback-only path unchanged until tested.
2. Verify zero-mandatory-cost provider eligibility, quota, data policy and owner approval. Add an explicitly configured adapter, bounded input/output and timeout. Prove real inference and evaluate allowed wording, safety and offline fallback. Expand approved paraphrase validation only with canon-grounded review; do not expose future facts or full script.
3. Preserve category/facts on locale/retry/replay; use localized authored fallback when a generated translation is unavailable, without another inference. Test concurrent requests, timeouts and replay through real PostgreSQL.
4. Then integrate Chapter 3 authorized RAT contexts, never expose its weakness in LAB records or pre-choice UI. Keep boar CORRECT-only behind its later narrative gate.

**At this early foundation milestone**, no AMI-007 acceptance criterion was complete, AMI-006 was partial and there was no real model inference. Later PRs implemented persistent slots, local Ollama inference and bounded RANDOM variety. The recovered Cloud Shell runtime still has gameplay generation temporarily disabled pending local model reactivation; see [current inference evaluation](ai-local-evaluation.md). This paragraph must not be read as today's implementation status.

## Historical durable integration increment (implemented)

NestJS now optionally reserves new INTRO/DOG generation requests under the existing session lock (AMI_AI_GENERATION=1). The additive pending-generation migration stores the already-selected category, authorized request and complete authored fallback next state before network I/O. Only the reserving caller sends a single authenticated HTTP request outside the lock, bounded by a 2500ms deadline. Identical duplicates wait and replay; conflicting mutations return 409. GET view or the next mutation recovers expired reservations with authored fallback, even after a process restart. Finalization writes progress, slot, receipt and audit status in one transaction; late responses never apply to a later attempt. No retry, no client prompt, no second draw. The existing default path remains synchronous when disabled; no provider or token is enabled by default. Existing save version and artwork unchanged. The current validator accepts the canonical localized wording only, so provider success changes audit provenance, not approved dialogue. Real inference and reviewed paraphrases remain pending. Tests exercise HTTP fake-service concurrency and expired reservation recovery on PostgreSQL.

## Historical optional local provider and evaluation (implemented; temporarily disabled on recovered VM)

Ollama transport is explicit opt-in only: AMI_AI_PROVIDER=ollama, AMI_OLLAMA_URL=http://ollama:11434 (internal network only) and AMI_OLLAMA_MODEL=<approved locally installed tag>. No automatic download, installation, cloud client, credential, public port or extra Compose service. The operator must set OLLAMA_NO_CLOUD=1 on the Ollama server, keep it private, and verify model license/resource suitability. Only localhost/loopback or the private Docker service name ollama is accepted; reject cloud tags and external URLs. Uses POST /api/generate, stream=false, bounded output, direct connection/no redirect. Official references: https://docs.ollama.com/api/generate and https://docs.ollama.com/faq. Google Cloud Shell has limited persistent storage (5 GB), ephemeral VM and interactive quotas: https://docs.cloud.google.com/shell/docs/quotas-limits. Check free -h, df -h / /home, docker system df before installing; do not provision billable resources. Run python -m app.evaluate_local inside the configured AI service only after owner approval and local setup. Six test cases across both locales output status/time, no protected content. Real inference has NOT yet been demonstrated. Do not enable production or make claims of generative paraphrasing; validator still accepts only exact approved utterances. No extra dependencies or automatic model calls in CI.

## November 18 — reconciled campaign and RAT authorization

PR #24 incorporates accepted main `af212f0` with no edits to narrative/visual files. Retains CP-RAT persistence, F1/F2 energy restoration and all accepted tests, adds Q-RAT exact context allowlist (CORRECT: RAT-LIGHT, RAT-CONTAINMENT; RANDOM: RAT-RECIPE) only for new rat consultation slots. Wrong category, incomplete, cross-encounter and future facts fail closed; cached retry and locale never call provider again. Q-BOAR remains denied. Local evaluation expands to ten cases. Strict canonical-only validation and fallback remain unchanged; real inference and safe dynamic variation still pending. No model installed, credentials or paid services. CI uses mocks only.

## Historical bounded response variation candidate (superseded)

The model may return the original fallback or one of a finite bilingual set of exact alternatives: INTRO penguins, DOG Saturn/cleaning, RAT folding clothes/penguins (all transcribed from private Master v1.13); one meaning-preserving CORRECT alternative per encounter. FastAPI and NestJS independently enforce exact context-local allowlists, rejecting arbitrary text, cross-encounter advice and spoilers. RANDOM fact pools include only the approved topics. A validated alternative is stored in both languages at finalization, including the non-recipe flag and existing reaction selection, never rerolling or changing energy/category/outcomes; the fallback stays unchanged. INTRO provenance may be generated; no fixed story dialogue edited. This is constrained model-selected variation, not unrestricted generation. The existing 2500ms deadline and local-only opt-in remain; actual model benchmark and owner review are pending.


## Accepted expanded RANDOM selection (superseded by PR #53 within-encounter non-repetition)
PRs #35/#36 (main `ec61f29`) authorize eight context-specific options each for INTRO, DOG and RAT, with exact bilingual mapping and recipe flags. The API submits the full context set; FastAPI accepts complete legacy or expanded sets, never arbitrary subsets. The provider shuffles and samples at most three, then validates exact numeric index and maps back to localized text. CORRECT stays unchanged; Q-BOAR is implemented in Chapter 5 as authored CORRECT only and never routed to the provider. No guarantee of no repetition, and cache is deliberately immutable. Default disabled on fresh deployments; prior owner installation opt-in was verified, current recovered VM uses fallback pending reactivation, not production hosting.
