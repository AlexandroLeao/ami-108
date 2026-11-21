# GroqCloud Free — bounded AI inference evaluation

**Status (November 21, 2026):** the optional Groq adapter merged in [PR #80](https://github.com/AlexandroLeao/ami-108/pull/80). Owner-triggered provider-only 1/1 and 10/10 bilingual evaluations passed November 20; the isolated real NestJS/FastAPI/Groq/PostgreSQL [2/2 game acceptance](https://github.com/AlexandroLeao/ami-108/actions/runs/44915899967) passed November 21. The live result was obtained **only on a disposable GitHub Actions runner**, not the hosted Vercel/Neon game. Hosted generation remains `AMI_AI_GENERATION=0`; no public activation, production qualification or new game behavior is approved. Earlier Qwen/Ollama acceptance and rejected Cloudflare/Gemma prototype remain separate historical evidence.

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

**Decision for private personal demo:** keep the proven, stable hosted game with authored fallback and `AMI_AI_GENERATION=0`; no extra provider or model feature is needed to accept the private campaign. If the owner separately wants live hosted Groq, first confirm Free plan, ZDR, secrets and quota, then validate only a disposable protected Preview session with a fixed cap before activating any player-facing setting.

## Remaining activation gates

1. Before activation, **reconfirm** the owner-observed Free plan, inherited quotas, billing state and [Inference APIs ZDR](https://console.groq.com/docs/your-data) in the intended project; account settings can change. Keep `AMI_GROQ_API_KEY` in private GitHub Actions secrets or protected server configuration, never in Git, chat or logs.
2. The **runner-only** NestJS → FastAPI → Groq → PostgreSQL validation was completed with two real localized commands. Before **hosted** player inference, separately test an authenticated, disposable Web → Vercel private API/AI → Neon Preview flow including timeout/fallback, replay and recovery. Never attach the owner's saved sessions or change the frozen local checkout.
3. Validate measured account quotas, rate/concurrency limits, key rotation, privacy, monitoring, safe rollback and zero mandatory cost against the selected hosting architecture. No automated real requests, scheduled probes or cross-provider failover.
4. Obtain separate owner sign-off for environment-specific player inference, external disclosure and any deployment. Do not enable Developer/pay-as-you-go billing, expose private narrative sources or represent index selection as free-form AI dialogue.

## Stop and fallback rules

If Free quota or latency is insufficient, **do not loosen the strict game-authority controls** or enable paid services by default. Preserve the existing Ollama/Qwen local evidence and authored fallback; assess an alternate Free provider or obtain explicit approval for a tiny capped paid test. In all cases the frozen playable Cloud Shell checkout and verified seven-session dump remain unchanged. The owner must still approve hosted storage, public distribution and final `v1.0.0` release.

Track deployment decisions in [issue #13](https://github.com/AlexandroLeao/ami-108/issues/13), offline/real validation in [issue #12](https://github.com/AlexandroLeao/ami-108/issues/12), source reconciliation in [issue #14](https://github.com/AlexandroLeao/ami-108/issues/14), rights/release in [issue #15](https://github.com/AlexandroLeao/ami-108/issues/15). The latest accepted project checkpoint is [release readiness](release-readiness-matrix.md).
