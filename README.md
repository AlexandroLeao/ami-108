# AMI-108

**A retrofuturistic narrative survival game about memory, trust and an AI companion.**

AMI-108 is an original, non-profit, story-driven 2D web game. Players progress through a five-chapter campaign by reading dialogue, making choices and uncovering memories. The game is available in **Portuguese (Brazil) and English**, with responsive desktop and mobile presentation.

> **Content advisory:** Violence, blood, strong language and horror. **16+ is an editorial recommendation, not an official age rating.** Formal classification and any applicable release obligations remain to be reviewed.

## At a glance

| Area | Implemented |
| --- | --- |
| Campaign | Five chapters, twelve narrative scenes and one ending |
| Interaction | Dialogue, branching choices, three encounters and checkpoints |
| Persistence | PostgreSQL-backed sessions, chapter replay and cached consultations |
| Languages | PT-BR and English, including authorized AI responses |
| Visuals | Twelve approved original scene illustrations and a responsive cinematic interface |
| AI companion | Optional private, local Qwen2.5:1.5b inference with server-authorized facts, output validation and safe authored fallbacks |
| Validation | Full-campaign HTTP smoke, image-integrity checks, migration tests and automated API/Web/Python suites |

The AI does **not** decide outcomes, change the rules or invent story facts. The game engine authorizes the context and available text; previously saved consultation responses remain unchanged on Continue, retry and chapter replay.

## Project status

**Five-chapter campaign: complete and approved in private playtests. Public release: not yet approved.**

The last accepted game-runtime change is [PR #53](https://github.com/AlexandroLeao/ami-108/pull/53) (`14ea583`), which corrected repeated RANDOM consultations and added opt-in local model residency. Its exact [CI run](https://github.com/AlexandroLeao/ami-108/actions/runs/44603955413) passed **221 tests** (105 API, 44 Web and 72 Python), four migrations and a full built-game smoke test, including all twelve artwork hashes. Documentation and recovery tooling have evolved separately without changing the approved campaign.

**Recovery checkpoint (November 19, 2026):** After the Cloud Shell Docker VM was recycled, the owner verified a private PostgreSQL archive and restored **six sessions, zero pending generations and four completed migrations**. Web, API, AI service and database were rebuilt and healthy; Continue resumed the existing game. **Live model generation remains temporarily disabled until the pinned local Ollama instance is restored and revalidated.** This is a local recovery state, not a claim of live or production AI availability.

The repository is **private**. No public deployment, billable infrastructure, distribution license or `v1.0.0` release has been authorized. The mandatory service-cost target remains **R$ 0**.

The remaining formal release work is tracked in [#12 — Security and QA](https://github.com/AlexandroLeao/ami-108/issues/12), [#13 — Hosting and deployment](https://github.com/AlexandroLeao/ami-108/issues/13), [#14 — Documentation](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15 — Release approval](https://github.com/AlexandroLeao/ami-108/issues/15). See the [release-readiness matrix](docs/release-readiness-matrix.md) for evidence and outstanding gates.

## Architecture

| Component | Technology | Responsibility |
| --- | --- | --- |
| `apps/web` | Next.js, React, TypeScript | Presentation, accessibility and same-origin game facade |
| `apps/api` | NestJS, Prisma | Authoritative narrative state, sessions, commands and consultation policy |
| `services/ai` | Python, FastAPI | Local-only authorized retrieval, generation and text validation |
| PostgreSQL | PostgreSQL 17 | Durable player state, checkpoints, consultation slots and receipts |
| Ollama | Qwen2.5:1.5b, optional | Private inference; not required for the authored-fallback path |
| `compose.yaml`, `infra/` | Docker Compose and build definitions | Local development stack, not a production deployment |

The model endpoint and database must not be made public. Current Cloud Shell preview routing is **development-only** and requires additional security controls before any hosted release. See the [system design](docs/architecture/system-design.md), [local API contracts](docs/api/README.md) and [production security gates](docs/architecture/production-security-gates.md).

## Working with the project

This repository is intended for a controlled, private development environment. Development uses Docker Compose, Node.js 22, pnpm and Python 3.12. See [development setup](docs/development.md) for prerequisites and configuration; do not commit `.env`, session cookies, database dumps or the private narrative sources.

**Returning to an existing Cloud Shell session:** Start with the [safe pause/resume runbook](docs/cloud-shell-pause-resume.md) and the read-only [recovery diagnostic](scripts/check-resume-readonly.sh). Verify saved-session backups and the existing database before starting or rebuilding services. Never restore an archive into a populated database or delete volumes as part of a normal update. Model installation and activation are separate, guarded steps.

**Testing:** The [GitHub CI workflow](.github/workflows/ci.yml) runs lint, type checks, Python checks, API/Web tests, Prisma validation/migrations and a built HTTP campaign smoke. See [release QA](docs/release-qa.md) and [AI evaluation evidence](docs/ai-local-evaluation.md) for measured results and limitations. Passing local tests is not a production capacity or security certification.

## Documentation

- [Requirements and traceability](docs/architecture/requirements.md), [domain invariants](docs/architecture/domain-model.md) and [architecture decisions](docs/architecture/decisions.md)
- [Approved interface](docs/ui-design.md), [art pipeline](docs/assets.md) and [narrative engine](docs/narrative-engine.md)
- [Accessibility/performance verification plan](docs/accessibility-performance-qa.md) and [dependency security review](docs/dependency-security-audit.md)
- [Release-readiness matrix](docs/release-readiness-matrix.md), [production plan](docs/production-plan.md) and [safe Cloud Shell recovery](docs/cloud-shell-pause-resume.md)

The canonical **Documento Mestre v1.14** and **Roteiro Interativo v1.12** remain private, with later owner-approved amendments pending synchronization. They are not distributed by this repository.

## Project ownership and release

The project owner defined and approved the original story, artwork direction, mechanics and presentation. Engineering implementation, code review and documentation were developed with AI assistance. All accepted narrative, art and gameplay rules remain under owner control.

The public-facing license, asset distribution terms, official age classification, hosting model and release date are **undecided**. Nothing in this README grants permission to redistribute assets, publish the source, or deploy the game. Release requires explicit owner authorization and completion of the outstanding security, accessibility, infrastructure and legal checks.
