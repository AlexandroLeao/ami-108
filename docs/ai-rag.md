# AMI-007 — controlled inference foundation

November 17, 2026. Draft increment after accepted PR #22 (`76946f9`). Source: private Master v1.12 / Script v1.10; existing canon and fallback wording unchanged.

## Implemented in this increment

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

## Next implementation gates

1. Review exact internal contract/authentication and add NestJS reservation/finalization with persistent immutable slot category/facts, deadline recovery, single charge, request ID, cache, provider budget, and stale attempt protection. Do not hold row locks across inference. No network retries after uncertain call. Keep existing fallback-only path unchanged until tested.
2. Verify zero-mandatory-cost provider eligibility, quota, data policy and owner approval. Add an explicitly configured adapter, bounded input/output and timeout. Prove real inference and evaluate allowed wording, safety and offline fallback. Expand approved paraphrase validation only with canon-grounded review; do not expose future facts or full script.
3. Preserve category/facts on locale/retry/replay; use localized authored fallback when a generated translation is unavailable, without another inference. Test concurrent requests, timeouts and replay through real PostgreSQL.
4. Then integrate Chapter 3 authorized RAT contexts, never expose its weakness in LAB records or pre-choice UI. Keep boar CORRECT-only behind its later narrative gate.

No acceptance criterion of AMI-007 is marked complete solely by this foundation. AMI-006 remains partial. Existing accepted Chapters 1–2 game code, images and data remain unchanged. No real model inference, provider credentials, budget consumption or deployment has been demonstrated.
