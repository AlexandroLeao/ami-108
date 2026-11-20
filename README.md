# AMI-108

**An original retrofuturistic narrative survival game about memory, trust and an AI companion.**

AMI-108 is a private, non-profit, story-driven 2D web game. The **five-chapter campaign** is playable in **Brazilian Portuguese and English**, with responsive desktop/mobile presentation, original pixel-art-inspired scenes, branching dialogue, checkpoints and three encounters.

> **Content advisory:** Violence, blood, strong language and horror. The current **16+** indication is an editorial recommendation, **not** an official Brazilian age classification.

## Gameplay and engineering

| Area | Implemented |
| --- | --- |
| Campaign | Five approved chapters, twelve narrative scenes, one complete ending |
| Decisions | Branching choices, three encounters, three checkpoints, memory and energy mechanics |
| Persistence | PostgreSQL-backed saves, replay, idempotent commands and cached consultation responses |
| Languages | PT-BR and English, including validated authorized AI text |
| Presentation | Twelve approved original scene illustrations and responsive cinematic UI |
| AI companion | Optional private Ollama/Qwen2.5:1.5b inference; server-authorized facts, validated output, fixed game rules and safe authored fallback |
| Quality | GitHub Actions CI, unit/integration tests, Prisma migrations and built-campaign HTTP/artwork-integrity smoke |

The server—not the language model—decides encounter probabilities, outcomes and energy. Once a consultation response is saved, Continue and replay preserve it.

## Technology

| Component | Stack | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React, TypeScript | Cinematic interface and same-origin game facade |
| API | NestJS, Prisma | Authoritative game state, commands, sessions and consultation policy |
| AI service | Python, FastAPI | Authorized retrieval, local inference and response validation |
| Database | PostgreSQL 17 | Persistent game and consultation state |
| Model | Ollama, Qwen2.5:1.5b | Optional private inference with controlled fallback |
| Operations | Docker Compose, GitHub Actions | Private local stack, builds and continuous integration |

Architecture and security details are in the [system design](docs/architecture/system-design.md), [API contracts](docs/api/README.md) and [production security gates](docs/architecture/production-security-gates.md).

## Project status

**Gameplay implementation: approved in private playtests. Public release: not authorized.**

The last owner-accepted game runtime is commit `14ea583` ([PR #53](https://github.com/AlexandroLeao/ami-108/pull/53)). The accepted game regression passed **221 automated tests** (105 API, 44 Web, 72 Python) plus the full built-campaign smoke and original artwork hash checks. Later documentation/operational PRs do not automatically change that accepted runtime.

The owner accepted local Qwen gameplay on the preceding VM, including desktop/mobile PT-BR/EN; this remains **historical model evidence**, not confirmation of inference on the replacement VM. On the replacement VM, all four application services were healthy and Continue worked before an owner-verified safe pause. The latest private PostgreSQL backup (`pause-ami108-20261120T155634Z-1926.dump`) passed SHA-256/full-read checks and preserved **7 sessions / 0 pending generations / 4 migrations**. The API had generation **OFF**, because Ollama was absent; all four services were then stopped without deleting data. See [release readiness](docs/release-readiness-matrix.md) and [safe pause/resume](docs/cloud-shell-pause-resume.md) for the authoritative checkpoint.

This repository remains **private**. There is **no public deployment, distribution license, official age classification or `v1.0.0` approval**. The mandatory service-cost target is **R$ 0**. Open gates are tracked in [#12 QA/security](https://github.com/AlexandroLeao/ami-108/issues/12), [#13 hosting](https://github.com/AlexandroLeao/ami-108/issues/13), [#14 documentation](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15 release](https://github.com/AlexandroLeao/ami-108/issues/15).

## Develop and verify

The validated development environment is **Google Cloud Shell** and Docker Compose, with **GitHub Actions for CI**. Cloud Shell is not a permanent public host. For tools, private configuration and reproducible development, read the [development guide](docs/development.md).

**Existing saves come first:** before starting/rebuilding services on a returned Cloud Shell VM, run the [read-only resume check](scripts/check-resume-readonly.sh) and follow the [safe recovery guide](docs/cloud-shell-pause-resume.md). Do **not** restore into a populated database, prune volumes or commit `.env`, cookies, database dumps or private story documents.

QA evidence and remaining manual checks are in the [release QA report](docs/release-qa.md) and [final acceptance worksheet](docs/final-qa-acceptance-worksheet.md). The [hosting feasibility analysis](docs/zero-mandatory-cost-hosting-assessment.md) distinguishes career-oriented AWS/DevOps exploration from a verified zero-cost production deployment.

## Documentation

Start with the [documentation index](docs/README.md). It separates current implementation references, operations, release decisions, dated evidence and archived development notes. Detailed restore logs and issue histories live there—not in this overview.

The private **Documento Mestre v1.14** and **Roteiro Interativo v1.12** predate final Chapter 5 acceptance. Their approved-source reconciliation is pending; neither the sources nor unreleased narrative passages are distributed here.

## Authorship and release

The owner authored and approved the story, artistic direction, game mechanics and presentation. Implementation, review, tests and documentation used AI assistance under the owner's decisions. No license or permission to redistribute artwork or source code is granted by this README. Any public release requires explicit owner approval and the outstanding legal, accessibility, security and hosting gates.
