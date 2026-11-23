# GroqCloud Free — bounded AI inference evaluation

**Current boundary (November 21, 2026):** `openai/gpt-oss-20b` is enabled in the public AMI-108 Production game. Owner-tested bilingual sessions and read-only Neon Production evidence recorded **seven `VALIDATED` consultation receipts**, one safely rejected `INVALID_OUTPUT` with authored fallback and zero pending generations. The model only selects a server-approved response index, never game outcomes or unrestricted narrative text. This is bounded acceptance, not a throughput, account-quota or reliability guarantee. Current state is recorded in [release readiness](release-readiness-matrix.md).

**Historical qualification:** The evidence below covers the November 20–21 provider-only, isolated game/DB and SSO-protected Preview acceptance stages. Statements about Groq being disabled in Production describe **those earlier checkpoints**, not the current public deployment.

## Free-first decision

- **Provider:** [GroqCloud](https://console.groq.com/), Free-plan candidate, **`openai/gpt-oss-20b`**. [Model reference](https://console.groq.com/docs/model/openai/gpt-oss-20b). Individual GitHub-runner samples satisfied the 2-second transport budget; this is not an end-to-end, concurrency or production latency guarantee.
- **Strict structured results:** [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs) lists this exact model as supporting `json_schema` with `strict:true`. Each request generates a one-property object `{"selection":"0"}` with a server-generated enumeration of authorized local options. **Strict JSON constrains structure, not factual correctness.** The FastAPI and NestJS validation layers retain complete authority.
- **Free limits:** Groq's [Free limits](https://console.groq.com/docs/rate-limits) list **30 requests/minute, 1,000 requests/day, 8,000 tokens/minute and 200,000 tokens/day** for this model. Actual project-account limits and provider availability may vary; check the account's Limits screen before activation.
- **Quota exhaustion:** exceeding any Free rate limit results in **HTTP 429**, not an automatic paid upgrade. AMI-108 must treat this as **`FALLBACK_REQUIRED`**, never launch background retries or interrupt player progress. The Free tier is a limited private/demo quota, not guaranteed high-volume public capacity. Do not enable Groq Developer/pay-as-you-go or a payment method without a separate owner decision. [Billing details](https://console.groq.com/docs/billing-faqs).
- **Privacy:** by default Groq says it does not retain customer request content except limited reliability/abuse and stateful-feature exceptions. [Zero Data Retention](https://console.groq.com/docs/your-data) can be enabled from Data Controls; usage metadata is still collected. Verify the actual account setting and applicable terms before forwarding approved snippets. **No full scripts, images, session IDs, player saves, private documents or unpublished facts**.
- **Low-cost fallback (not activated):** published GPT-OSS 20B input/output list prices are **US$0.075/US$0.30 per million tokens** on a paid usage plan. This excludes database, hosting, bandwidth and other charges; there is **no permission** to upgrade or pay.

## Existing game architecture and provider boundary

| Concern | Owning layer and assurance |
| --- | --- |
| Authentication, slot/energy, random category and authorized facts | NestJS + PostgreSQL, unchanged |
| Internal API and provider integration | FastAPI `Provider` protocol, behind `AMI_AI_PROVIDER=groq`; no calls with blank env or `AMI_AI_GENERATION=0` |
| Model request | Fixed `https://api.groq.com/openai/v1/chat/completions` via Python HTTPS (no SDK side effects, arbitrary URLs or redirects), 2-second timeout, one call/no retry |
| Context disclosure | Maximum three **previously approved English options**, not the player's data or the whole narrative |
| Constrained selection | Strict schema with dynamically generated string enum and exactly one required `selection` key, `reasoning_effort=low`, `max_completion_tokens=96` |
| Returned game text | Only a server-authorized index mapped to an approved **localized** string; all other content rejected, including extra keys, prose, non-`stop`, 401/403/429, invalid JSON, timeout |
| Cloud quota failure | Existing authored fallback; no hidden payment or cross-provider failover that could leak data without consent |

**Important product boundary:** this is **real inference selecting one of the preapproved sentences**, not free-form generation of new narrative dialogue. Adding controlled wording variation is a separately scoped, owner-reviewed feature: it must preserve the approved five chapters, facts, choices and authored fallback and pass new bilingual tests. Do not claim fully generative dialogue in the portfolio until it is implemented and evaluated.

## Dated provider-only acceptance evidence — November 20, 2026

- **Merged implementation:** [PR #80](https://github.com/AlexandroLeao/ami-108/pull/80) on GitHub `main` at `76733acf`; [post-merge CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44807240838) passed. Push/PR CI uses mocks and makes no real Groq requests.
- **Single diagnostic:** owner-dispatched [run 44807846552](https://github.com/AlexandroLeao/ami-108/actions/runs/44807846552), `diagnostic-one`, returned **1/1 VALIDATED** for INTRO-RANDOM/PT-BR in **212 ms**.
- **Bilingual sample:** owner-dispatched [run 44809358698](https://github.com/AlexandroLeao/ami-108/actions/runs/44809358698), `acceptance-ten`, returned **10/10 VALIDATED**, five PT-BR and five EN: INTRO-RANDOM, DOG-RANDOM, RAT-RANDOM, DOG-CORRECT and RAT-CORRECT. Observed **203–384 ms**, **273 ms median**, evaluator-reported **384 ms p95**; no sampled fallback. The workflow first validated the ten fixtures offline, then made one request per case without retries.
- **Scope:** direct, credential-gated FastAPI-provider evaluation from private GitHub Actions runners against the exact authorized selection contract. It did **not** exercise Next.js, NestJS, PostgreSQL, player saves, checkpoint replay, production concurrency or any running Cloud Shell game. CI negative-path tests do **not** constitute an observed live HTTP 429/quota failure. Sample success does not certify reliability at scale.

## Owner-observed Free account controls — November 20, 2026

Owner-provided Groq Console screens for the **Personal / Default Project** show **Free ($0)** as the current plan, **no project-specific rate-limit overrides**, and inherited `openai/gpt-oss-20b` limits of **30 requests/minute, 1,000 requests/day, 8,000 tokens/minute and 200,000 tokens/day**. A subsequent Data Controls screen shows **Inference APIs Zero Data Retention enabled**; Global ZDR remains disabled. These are dated owner observations, not an API audit, long-term service guarantee or approval to transmit player data. No screenshots or credentials are stored in Git.

## Offline FastAPI HTTP integration checks

The test module [`tests/test_groq_http_integration.py`](../services/ai/tests/test_groq_http_integration.py) exercises the **real FastAPI authentication, retrieval, Groq adapter, strict JSON selection and localized response** using a fully mocked HTTPS transport. It verifies ten authorized PT-BR/EN context pairs, bounded disclosures, one provider request, rejected internal auth/future facts, 401/403/429, invalid selections and a timeout. This test **never calls Groq** and does not exercise the NestJS/PostgreSQL transaction path; existing API/PostgreSQL tests cover reservation, retry and persisted slots separately. The combined live game/DB/provider acceptance is documented separately below; these offline tests themselves contain no provider calls.

## Isolated game/DB/provider acceptance — November 21, 2026

**Observed:** the owner manually dispatched [GitHub Actions run 44915899967](https://github.com/AlexandroLeao/ami-108/actions/runs/44915899967) from reviewed `main` commit `3e89f80`. The `isolated-groq` job completed successfully: two Jest tests in [`game.live-groq.spec.ts`](../apps/api/test/game.live-groq.spec.ts) were **2/2 PASS**. One PT-BR consultation completed in **1455 ms** and one EN consultation in **1119 ms**, as measured by the test runner. Both asserted `VALIDATED` generation receipts, one persisted DOG slot, expected energy debit, state recovery through `/game/view`, and idempotent replay of the same command. The final cleanup check confirmed zero remaining `GameSession` rows.

**Isolation:** the workflow used a temporary PostgreSQL 17 `ami_groq_ci` database on the runner, NestJS commands, localhost-only FastAPI and live Groq calls, with the GitHub Actions provider key. The request budget was two; no Neon or Cloud Shell database or owner saves were used or modified. Provider credential was not printed by the test; GitHub Actions masking is not proof of comprehensive secret scanning. The post-merge [CI run 44915808272](https://github.com/AlexandroLeao/ami-108/actions/runs/44915808272) also passed, but ordinary CI intentionally skips live requests.

**Not established:** a browser-to-Vercel-to-Neon hosted Groq path, provider robustness at scale, measured account quota under multiple sessions, current ZDR/billing state or a live provider 429 failure. Negative-path 401/403/429/timeout behavior is covered by offline mocked HTTP tests only. The visible answer can match an authored fallback: evidence of actual inference is the persisted `VALIDATED` receipt, not merely its displayed wording.

**Decision at this historical runner checkpoint:** Groq qualified for protected QA; Production was not yet activated. Later owner-approved Production acceptance is recorded in [release readiness](release-readiness-matrix.md). The game still selects only approved text, with authored fallback for invalid outputs.

## Hosted Vercel/Neon inference — November 21, 2026

**Deployment:** Vercel `dpl_6eNVpUWNsMSGMjUU4G9kwPZNjaQu` is READY, sourced from reviewed `main` commit `1782a048` on dedicated branch `qa/hosted-groq-acceptance-20261121`. Vercel Authentication remains enabled. Preview-specific settings are `AMI_PUBLIC_GAME=1`, `AMI_AI_GENERATION=1`, `AMI_AI_PROVIDER=groq`, `AMI_GROQ_MODEL=openai/gpt-oss-20b`, and a Sensitive `AMI_GROQ_API_KEY` bound only to this branch. Production and generic Preview remain OFF. The owner removed an unintended Production-target Groq secret and the absence was verified through metadata; no secret values were retrieved or committed.

**Persisted proof:** after the owner's gameplay test, a read-only Neon Preview query recorded one new `GameCommandReceipt.generationStatus='VALIDATED'` for locale `pt-BR` at `2026-11-21T15:46:35.999Z` UTC. There were 0 `GamePendingGeneration` rows at that checkpoint; the environment preserved 6 existing sessions. Seven `FALLBACK_REQUIRED/UNAVAILABLE` receipts were from an earlier interval before the final key-backed deployment. These observations support a working real hosted PT-BR generation/transaction path, **not** model reliability at scale or a complete end-to-end live EN path. The existing [EN runner test](https://github.com/AlexandroLeao/ami-108/actions/runs/44915899967) remains separate evidence.

**Owner observation:** the user reported current gameplay and the requested short accessibility checks passed. This does not certify WCAG, capture an HTTP trace or prove how other users' sessions perform.

**Follow-up inspection:** after the owner's English QA, read-only Neon Preview counts showed 4 `VALIDATED` receipts (1 in a currently PT-BR session, 3 in currently EN sessions), 8 `FALLBACK_REQUIRED` (7 historical `UNAVAILABLE` and one `INVALID_OUTPUT` in an EN session), zero pending and seven retained sessions. The query groups by **current** session language, not event-time language; owner gameplay establishes the tested English path. No data was modified. Wider access still requires quotas, Origin/retention review and a separate public release decision.

## Follow-up observation: English QA and active edge guard

After the owner's English playtest, a read-only Neon Preview aggregation on November 21 found **4 `VALIDATED` receipts** in sessions currently localized as PT-BR (1) and EN (3), **8 `FALLBACK_REQUIRED`** and no pending generation. One EN-session `INVALID_OUTPUT` was rejected and handled by the authored fallback. A validated receipt is evidence that the bounded inference result was persisted; this is not a guarantee of provider availability or event-time locale if the session changed language.

A Vercel firewall rule named `ami-game-session-create-5-per-minute-per-ip` was configured for **POST `/api/game/session`**. Its actual enforcement on the Hobby plan was not independently demonstrated, and it is not a global model/token budget or a substitute for the deployed database-backed limits. Do not claim that it reliably blocked requests without direct validation.

## Ongoing Production safeguards

1. Reconfirm the Groq Free-plan limits, billing state and [Inference APIs Zero Data Retention](https://console.groq.com/docs/your-data) before changing provider or quota settings. November 20 Console screenshots are dated owner observations, not a permanent service guarantee.
2. Keep `AMI_GROQ_API_KEY` server-side and never publish credentials, unpublished narrative material or session data. Continue to enforce approved-candidate selection, exact response validation, one bounded provider call and authored fallback on errors or quota exhaustion.
3. Production applies database-backed UTC-day limits of **50 new games** and **100 attempted model calls**. These do not establish throughput headroom or full WAF protection. Any larger launch requires new capacity, privacy, retention and abuse evidence.
4. Do not enable paid billing, automatic real-model probes, additional providers, unrestricted dialogue or gameplay changes without a separate owner decision. Preserve the approved five-chapter narrative and existing saves.

Historical provider-only and Preview results remain in this file. Current public release scope, missing guarantees and the deferred formal version tag are recorded in [release readiness](release-readiness-matrix.md) and [closed issue #15](https://github.com/AlexandroLeao/ami-108/issues/15).
