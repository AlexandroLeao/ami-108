# Optional cloud inference — evaluation and activation gates

**Status: connector prototype, OFF by default; no Cloudflare account, remote calls, external story disclosure or deployment authorized.** This is a *technical candidate*, not proof that a remote model passed the game acceptance suite. The accepted local Qwen2.5:1.5b / Ollama evidence remains historical and unchanged. The accepted game runtime in the owner’s Cloud Shell stays frozen and safely paused.

## Why this exists

AMI-108 already demonstrates Next.js, NestJS, PostgreSQL, Python/FastAPI, local inference, CI, deterministic game authority and safe fallback. A **second optional bounded provider** demonstrates the same interface against hosted inference, contract testing and controlled failure handling without adding unrelated agent frameworks, embeddings or a vector database to the five-chapter campaign.

## Technical boundary

| Layer | Owner | Permitted behavior |
| --- | --- | --- |
| Web and same-origin facade | Next.js | Only current authorized view and actions; never receives a provider API token |
| Game authority | NestJS/Prisma | Picks category, allowed facts, energy/slot/receipt and fallback; reserves/finalizes transactions; **not** the model |
| AI service | FastAPI | Authenticated request with strict 8 KiB body, finite fact IDs, approved candidates and a 2.5-second game deadline |
| Local provider | Ollama/Qwen2.5:1.5b | Previous VM reference for local inference; requires its own guarded capacity and license review |
| Optional remote provider | Cloudflare Workers AI | **Exact fixed HTTPS origin**; no custom endpoint, proxy, credentials in prompts or query strings. Only a small set of already-approved English option strings goes to the provider, never the player’s state or the full script |
| Response boundary | FastAPI and NestJS | Return only an exact authorized numeric index mapped to an existing localized PT-BR/EN utterance; failure, busy responses, non-200, redirects, malformed outputs and quotas use the existing authored fallback |

The connector implements only the **OpenAI-compatible Chat Completions** request shape against Cloudflare’s documented `https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1/chat/completions`. It sends `stream=false`, a short system instruction, a map of finite approved options and a single bounded response with an existing transport timeout; there are **no automatic network retries**. Neither the model nor Cloudflare can choose the correct encounter answer or modify player progress.

The config accepts only `AMI_AI_PROVIDER=cloudflare`, a 32-hex-character account ID, a restricted token shape and a **reviewed explicit model allowlist**. The current *candidate* model `@cf/google/gemma-4-26b-a4b-it` must still be checked against the current **Free plan**, model terms, provider privacy settings, 2-second provider deadline and game output quality. No model is downloaded by the repo, and no token is hardcoded.

## Cost and platform considerations (checked November 20, 2026)

- **Workers AI Free:** [Cloudflare documents 10,000 Neurons/day at no charge](https://developers.cloudflare.com/workers-ai/platform/pricing/). On Workers Free, exceeding that allocation fails rather than creating a paid overage; **some models still require a paid plan**, and model availability/deprecations can change.
- [OpenAI-compatible REST API](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) exists for Chat Completions. An API-compatible model is **not** automatically functionally accepted for AMI-108; index-only outputs and PT-BR/EN mapping require test evidence.
- [Model deprecation notice dated November 5, 2026](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/) moved several removals to **November 20, 2026**. Avoid introducing those model IDs as supported defaults.
- **Hosting is a separate architecture:** [Vercel Hobby](https://vercel.com/pricing) is restricted to personal/non-commercial use; its functions are not an always-resident Ollama host. [Neon Free](https://neon.com/pricing) can be considered for an independent PostgreSQL database but its limits, serverless connection pooling, backups and retention need actual review. The local Docker Compose stack and private saved sessions must not be migrated by assumption.

## Automated/offline verification

- Cloudflare provider mode must remain OFF when unset or missing credentials.
- Reject malformed account IDs, unsupported/paid/deprecated model identifiers, missing and malformed tokens.
- Confirm TLS transport can only reach the fixed Cloudflare host, with an account-specific path and no redirects or user-supplied URLs.
- Confirm the body contains at most three **previously approved** RANDOM choices, no player state/request ID/internal token and no arbitrary fact IDs.
- Confirm a valid index maps only to the requested locale’s approved choice; invalid index, extra prose, malformed response, oversized response, 401, 429 and timeout do not leak provider content into game state.
- Confirm unauthorized contexts do **not** call the provider, and real-model calls never run in GitHub CI.
- Run existing Python lint, mypy, pytest and full application integration/CI smoke; do not alter the frozen game or Cloud Shell just for CI.

## Live acceptance gate — explicitly requires owner approval

**Do not set a real token or enable `AMI_AI_GENERATION=1` yet.** Before any live test, obtain owner approval to send the narrow allowed option set to the selected provider and create a disposable account/test environment, with no real saved sessions, hidden future facts, private PDFs or artwork. Verify:

1. Actual account remains **Workers Free**, with no mandatory billing or paid-only model. Ensure model has correct current ID, availability, throughput and license.
2. Security and privacy: scoped token, secrets store (not repo/CI logs, Compose inspection or browser), logging/retention/no-training settings, allowed regions and incident procedure.
3. Measure **ten authenticated bilingual** cases and at least three quota/busy/failure cases against the actual remote model. Record results, p50/p95/range and negative outcomes. Do **not** relabel local Qwen’s 10/10 as cloud evidence.
4. Confirm API’s **2.5-second total deadline** still works for the hosted model, including cold starts. If missed, choose a different eligible model or retain fallback.
5. Validate exact one-request reservation/finalization, idempotent saves, correct energy/slot behavior and no extra billing after retries/timeouts using **disposable** database state.
6. Review and approve deployment adapters, Vercel function compatibility, persistent PostgreSQL, TLS, same-origin cookies, rate limiting and rollback **before** any public link.

## Operator and documentation notes

The already paused Cloud Shell checkout must **not** be fast-forwarded to the latest GitHub `main` or have secrets copied into its `.env` solely because this connector exists. The default `AMI_AI_GENERATION=0` and blank `AMI_AI_PROVIDER` leave the approved fallback path unchanged. Development uses isolated mocked tests; cloud inference is a *candidate* pending model/authorization acceptance.

Track engineering evidence in [issue #12](https://github.com/AlexandroLeao/ami-108/issues/12), hosting/cost choices in [#13](https://github.com/AlexandroLeao/ami-108/issues/13), canonical sources in [#14](https://github.com/AlexandroLeao/ami-108/issues/14) and public-release authorization in [#15](https://github.com/AlexandroLeao/ami-108/issues/15). The single latest project status remains [release readiness](release-readiness-matrix.md).
