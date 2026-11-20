# GroqCloud Free — bounded AI inference acceptance plan

**Status (November 20, 2026):** offline integration **candidate**; no Groq key, deployment, live call or model acceptance is implied by this document. **Owner requirement:** final AMI-108 should demonstrate genuinely live inference, not just locally authored fallback. The previously accepted local Qwen/Ollama evaluation remains independently valuable; the Cloudflare Gemma 4 prototype was stopped after failing its real bounded contract.

## Free-first decision

- **Provider candidate:** [GroqCloud](https://console.groq.com/), Free plan, **`openai/gpt-oss-20b`**. Its [model card](https://console.groq.com/docs/model/openai/gpt-oss-20b) lists high-speed text inference; actual 2-second provider and 2.5-second game deadlines require fresh measurements.
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

## Safe acceptance sequence (not yet run)

1. Owner verifies **Personal / Free** project status, per-model Limits, and **Data Controls → Zero Data Retention**. Do not click **Upgrade to Dev Plan** or create billing details for this Free test.
2. Review the isolated Groq adapter diff and its offline tests (no production credential is present in CI). The [manual-only GitHub Actions workflow](../.github/workflows/groq-evaluation.yml) is prepared, but cannot make any real calls during PR/push CI. After review and merge, the owner selects `diagnostic-one` and enters `I_APPROVE_1_GROQ_CALL` on `main`; the separate `acceptance-ten` mode requires `I_APPROVE_10_GROQ_CALLS` and is not the first step.
3. Owner creates an API key in [Groq Console → API Keys](https://console.groq.com/keys) and enters its value **directly** into a private GitHub Actions repository secret `AMI_GROQ_API_KEY`. Never post or screenshot the key in chat, issues, workflow logs or README.
4. **Only one** private, owner-triggered test call using an already approved INTRO-RANDOM/PT-BR context; capture only a bounded HTTP/status reason and timing, never the prompt, response, key or ID. Test must validate within the required 2.5-second game deadline.
5. If the single probe passes, run an independently gated **ten-case** PT-BR/EN suite (INTRO, DOG, RAT, correct and random) on disposable evaluation requests. Require 10/10 valid, measure latency/negative cases, 429 fallback, no retries and no revealed private content.
6. Before allowing real player use, verify Free quota behavior with projected traffic, key rotation, rate limiting, secure backend-only secrets, hosting network rules, operational rollback, and independent game save/replay QA. Any remote-inference acceptance must be recorded as specific dated evidence, not implied by green unit tests.

## Stop and fallback rules

If Free quota or latency is insufficient, **do not loosen the strict game-authority controls** or enable paid services by default. Preserve the existing Ollama/Qwen local evidence and authored fallback; assess an alternate Free provider or obtain explicit approval for a tiny capped paid test. In all cases the frozen playable Cloud Shell checkout and verified seven-session dump remain unchanged. The owner must still approve hosted storage, public distribution and final `v1.0.0` release.

Track deployment decisions in [issue #13](https://github.com/AlexandroLeao/ami-108/issues/13), offline/real validation in [issue #12](https://github.com/AlexandroLeao/ami-108/issues/12), source reconciliation in [issue #14](https://github.com/AlexandroLeao/ami-108/issues/14), rights/release in [issue #15](https://github.com/AlexandroLeao/ami-108/issues/15). The latest accepted project checkpoint is [release readiness](release-readiness-matrix.md).
