# AMI-108

**An original retrofuturistic narrative survival game about memory, trust and an AI companion.**

AMI-108 is an original, noncommercial, story-driven 2D web game, playable online. The **five-chapter campaign** is playable in **Brazilian Portuguese and English**, with responsive desktop/mobile presentation, original pixel-art-inspired scenes, branching dialogue, checkpoints and three encounters.

> **Content advisory:** Violence, blood, strong language and horror. The current **16+** indication is an editorial recommendation, **not** an official Brazilian age classification.

## Gameplay and engineering

| Area | Implemented |
| --- | --- |
| Campaign | Five approved chapters, twelve narrative scenes, one complete ending |
| Decisions | Branching choices, three encounters, three checkpoints, memory and energy mechanics |
| Persistence | PostgreSQL-backed saves, replay, idempotent commands and cached consultation responses |
| Languages | PT-BR and English, including validated authorized AI text |
| Presentation | Twelve approved original scene illustrations and responsive cinematic UI |
| AI companion | Groq GPT-OSS 20B active in Production; historical local Ollama/Qwen experiments. The model selects only approved bilingual responses, with server-side validation and authored fallback |
| Quality | GitHub Actions CI, unit/integration tests, Prisma migrations and built-campaign HTTP/artwork-integrity smoke |

The server—not the language model—decides encounter probabilities, outcomes and energy. Once a consultation response is saved, Continue and replay preserve it.

## Technology

| Component | Stack | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React, TypeScript | Cinematic interface and same-origin game facade |
| API | NestJS, Prisma | Authoritative game state, commands, sessions and consultation policy |
| AI service | Python, FastAPI | Authorized retrieval, local inference and response validation |
| Database | PostgreSQL 17 | Persistent game and consultation state |
| Model | Groq GPT-OSS 20B (Production); Qwen2.5:1.5b (historical local) | Real constrained inference; no unrestricted narrative generation |
| Operations | Docker Compose, GitHub Actions | Private local stack, builds and continuous integration |

Architecture and security details are in the [system design](docs/architecture/system-design.md), [API contracts](docs/api/README.md) and [production security gates](docs/architecture/production-security-gates.md).

## Play online and project status

**Playable web demo:** [AMI-108 on Vercel](https://ami-108.vercel.app/game). On November 21, 2026, a signed-out browser confirmed that a new game opens without a Vercel account, shows the approved localized 16+ content advisory before creating a session, and renders Chapter 1 artwork and navigation. The owner also completed the full five-chapter campaign in PT-BR and EN, including desktop/mobile and saved-progress reloads. The live Production Groq integration has persisted seven validated consultation receipts across two owner-tested sessions, with an authored fallback on one rejected model result. These are bounded observations, not a claim of zero defects or universal availability.

**Runtime:** Next.js → private NestJS API → private FastAPI/Groq → Neon PostgreSQL, hosted on Vercel. Production applies the five tracked Prisma migrations. The database enforces daily public-mode limits of **50 new games and 100 AI attempts**; once exhausted, new games receive HTTP 429 while model consultations use the authorized fallback. These quotas bound admissions and provider calls, not every source of traffic or costs. Vercel Authentication protects Preview and individual deployment URLs; the canonical Production domain is accessible to visitors. The operating objective is no mandatory paid services, subject to each provider's current Free/Hobby quotas.

**Source repository:** [GitHub — AMI-108](https://github.com/AlexandroLeao/ami-108). Its visibility is controlled by the owner separately from the deployed game; a visitor can view it only once the owner changes GitHub visibility to Public. Original project source and images are shared for portfolio inspection only: **no general reproduction, modification or redistribution license is granted**. Third-party dependencies remain governed by their own licenses. The twelve original scene images were produced with OpenAI image-generation assistance from owner references and creative direction; see [provenance](docs/assets.md). Reference sheets, private narrative manuscripts, archives and live credentials are not included.

The `16+` content warning is the owner's **editorial recommendation**, not a claim of an official Brazilian age-rating certificate. It identifies violence, blood, strong language and horror; [classification guidance](docs/release-classification.md) documents the formal route for any applicable distribution requirements. The [current release-readiness record](docs/release-readiness-matrix.md) distinguishes functional acceptance from remaining administrative source visibility, licensing and formal version-tag decisions. No `v1.0.0` Git tag is claimed yet.

The owner-approved complete narrative/gameplay baseline was frozen at `14ea583` ([PR #53](https://github.com/AlexandroLeao/ami-108/pull/53)); subsequent reviewed changes concern deployment, AI provider integration, persistence safeguards, testing and operations, not new story chapters.


## Develop and verify

The validated development environment is **Google Cloud Shell** and Docker Compose, with **GitHub Actions for CI**. Cloud Shell is not a permanent public host. For tools, private configuration and reproducible development, read the [development guide](docs/development.md).

**Existing saves come first:** before starting/rebuilding services on a returned Cloud Shell VM, run the [read-only resume check](scripts/check-resume-readonly.sh) and follow the [safe recovery guide](docs/cloud-shell-pause-resume.md). Do **not** restore into a populated database, prune volumes or commit `.env`, cookies, database dumps or private story documents.

QA evidence and remaining manual checks are in the [release QA report](docs/release-qa.md) and [final acceptance worksheet](docs/final-qa-acceptance-worksheet.md). The [hosting feasibility analysis](docs/zero-mandatory-cost-hosting-assessment.md) distinguishes career-oriented AWS/DevOps exploration from a verified zero-cost production deployment.

## Documentation

Start with the [documentation index](docs/README.md) and [documentation maintenance policy](docs/documentation-standards.md). It separates current implementation references, operations, release decisions, dated evidence and archived development notes. Detailed restore logs and issue histories live there—not in this overview.

The private **Documento Mestre v1.14** and **Roteiro Interativo v1.12** predate final Chapter 5 acceptance. Their approved-source reconciliation is pending; neither the sources nor unreleased narrative passages are distributed here.

## Authorship and release

The owner authored and approved the story, artistic direction, mechanics and presentation. The owner reports that all accepted scene illustrations were generated with OpenAI assistance from their references and creative direction; see the [asset provenance record](docs/assets.md). Implementation, review, tests and documentation also used AI assistance. This is a provenance statement, not an independent audit of third-party reference rights. No permission to redistribute artwork or code is granted by this README.

The current `16+` advisory remains editorial, not an official classification. See the [Brazilian classification procedure](docs/release-classification.md). Source publication, any required classification steps and a formal version tag remain separate owner decisions.
