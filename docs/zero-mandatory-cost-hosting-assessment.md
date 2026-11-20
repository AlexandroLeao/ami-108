# Hosting feasibility and release constraints

**Status:** engineering comparison only, **no provider selected or infrastructure provisioned**. The owner requires **R$ 0 in mandatory service costs**, a private repository, and separate authorization for billing, service accounts, external model disclosure and public release. The approved local game runs Web/Next.js, NestJS, FastAPI, PostgreSQL and optionally pinned Qwen2.5:1.5b through Ollama. See the [current readiness matrix](release-readiness-matrix.md).

## Decision requirements

A production candidate must establish, by actual tests and provider terms, all of the following:

- **Functionality:** the accepted current-only game projection, authenticated server facade, persistent sessions, migrations, historical replay and deterministic fallback keep their behavior.
- **State and privacy:** managed PostgreSQL or proven durable storage, protected backups, secret management, explicit retention rules and no unintended disclosure of private narrative data.
- **Inference:** either the **approved pinned model** in a sufficiently provisioned long-running host, or a separately authorized and fully revalidated remote inference integration. Do **not** call an untested remote model equivalent to the previously approved Qwen.
- **Security:** trusted HTTPS origin, authenticated private backend paths, rate limits, abuse controls, model deadline/fallback, logs and minimal public ingress as specified in [production security gates](architecture/production-security-gates.md).
- **Costs:** validated account eligibility, monthly quotas, regional availability, overage/billing behavior and sustainable use without mandatory charges. A trial credit is not a perpetual zero-cost guarantee.
- **Operations:** tested startup, backups, restore drills, health endpoints, monitoring, deployment/rollback and incident ownership. A test build or source diagram is not an actual deployment.

## Candidate architectures

| Candidate | Feasible role | What remains unverified |
| --- | --- | --- |
| **Vercel + managed PostgreSQL + separate inference** | Next.js Web is a natural fit; [NestJS](https://vercel.com/docs/frameworks/backend/nestjs) and [FastAPI](https://vercel.com/docs/frameworks/backend/fastapi) have **Vercel Functions** support, subject to deployment adaptations. [Hobby terms](https://vercel.com/docs/plans/hobby) restrict eligibility/quotas | Docker Compose service discovery, session cookie/Origin policy, cold starts, DB pooling, backend privacy, free-tier limits, and where actual inference runs |
| **Neon PostgreSQL Free**, in a modular architecture | [PostgreSQL-compatible hosted database](https://neon.tech/pricing) is a possible persistent state provider | Quotas, retention, pooling, production restore, backups, security and data-location implications; not implicitly chosen by listing it |
| **Cloudflare Workers AI** or **Vercel AI Gateway** | [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) and [AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing) describe limited free usage for eligible inference | Exact model availability, token/neurons budgets, queue/concurrency, latency, prompt privacy, approved provider contract and game-specific output regression |
| **Single always-free VM, if eligible** | Could retain the containerized NestJS/FastAPI/PostgreSQL/Ollama topology. [OCI Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) is one research candidate | Account and region quota, ARM64 images, 3 GiB model memory, acceptable CPU response times, storage durability, idle reclaim, payments verification, TLS and backup policy |
| **Google Cloud Run / AWS free or trial usage** | Potential infrastructure experiments under [Google's free program](https://docs.cloud.google.com/free/docs/free-cloud-features) and [AWS account-specific offers](https://aws.amazon.com/free/) | Actual eligibility, charges outside quotas, stable PostgreSQL/Ollama residency and any trial expiration. Not an approved permanent free host |
| **Existing Google Cloud Shell preview** | Already accepted for private development and owner gameplay verification | **Not** persistent public hosting. Its temporary VM/volumes may recycle; model installation is currently blocked by insufficient safe disk headroom |

**Vercel is not ruled out because NestJS or FastAPI is unsupported.** The unresolved part is adapting the project's stateful container arrangement and choosing a compatible **separate AI inference and database service**. The previously approved Ollama setup expected a resident model and internal network; it cannot simply be assumed to run permanently inside a serverless function.

For Cloudflare, OCI, Vercel and any other free tier, provider terms and available models may change. Recheck the primary sources at the time of the actual decision rather than treating this comparison as locked pricing.

## Decision path — no automatic deployment

**Option A — private local milestone.** The owner may accept the five-chapter private game as a completed playable milestone with the already-approved local-model history, currently verified authored fallback, seven-session backup and explicitly documented public-release blockers. This is **not** public `v1.0.0`.

**Option B — production candidate.** The owner explicitly selects the target architecture and approves any service accounts, specific data transfer and resource provisioning. Engineers then prepare a small **private, non-public proof** using disposable test data, run compatibility/security/cost gates and only afterward request separate public-launch approval.

Do not import the actual seven saved sessions, canonical documents or unpublished reference sheets into an external provider by default. Any remote model receives only the minimum explicitly approved authorized facts after a privacy/contract review; opt-in integration requires fresh behavior, fallback and latency testing.

## Release, rights and classification

The current **16+** warning is an **editorial content notice**, not an official classification. The applicable Brazilian process and age descriptors must be checked for the selected distribution channel using the [Ministry of Justice classification guidance](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/paginas-classificacao-indicativa/jogos-e-apps). Source and original-asset redistribution rights, repository visibility, third-party notices and license choice require explicit owner sign-off before any public launch.

## Ownership and references

- [Issue #13](https://github.com/AlexandroLeao/ami-108/issues/13): hosting feasibility, verified zero-cost constraints and reproducible deployment.
- [Issue #12](https://github.com/AlexandroLeao/ami-108/issues/12): application security, accessibility and performance evidence.
- [Issue #14](https://github.com/AlexandroLeao/ami-108/issues/14): private canonical-document reconciliation and technical docs.
- [Issue #15](https://github.com/AlexandroLeao/ami-108/issues/15): release rights and explicit launch authorization.

**No provider choice, public endpoint, paid subscription or `v1.0.0` tag is authorized by this research.**
