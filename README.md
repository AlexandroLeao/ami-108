# AMI-108

**A retrofuturistic, post-apocalyptic narrative survival game about memory, trust and relying on an AI companion.**

AMI-108 is an original, noncommercial 2D web game. Survive a five-chapter story by making branching decisions, managing limited energy and memory, and consulting the AMI-108 companion. Its answers are not unrestricted: the experience explores the reliability and limits of AI assistance.

**[Play online](https://ami-108.vercel.app/game)** · **[Source code](https://github.com/AlexandroLeao/ami-108)** · **[Technical documentation](docs/README.md)**

> **Content advisory:** Violence, blood, strong language and horror. The 16+ indication is an editorial recommendation, not an official Brazilian age classification.

## Features

- Five complete chapters, twelve original scene illustrations and one ending.
- Branching dialogue, three encounters, checkpoints, memory and energy mechanics.
- Persistent PostgreSQL saves, chapter replay and idempotent game commands.
- Responsive web interface in Brazilian Portuguese and English.
- Real Groq inference for the AI companion, restricted to selecting previously approved bilingual responses. The server validates selections and uses authored fallback when inference fails or reaches its budget.

The language model never decides encounter outcomes, changes game rules or generates unrestricted story dialogue. See [AI behavior](docs/ai-rag.md) and [Groq evaluation](docs/groq-inference-evaluation.md).

## Technology and architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React 19, TypeScript | Responsive game interface and same-origin API facade |
| Game API | NestJS, Prisma | Game authority, session commands, persistence and AI consultation policy |
| AI service | Python 3.12, FastAPI | Authorized context, constrained inference and response validation |
| Data | Neon PostgreSQL 17 | Saved games, consultation receipts and public usage counters |
| AI provider | Groq, `openai/gpt-oss-20b` | Real inference selecting an approved response index |
| Engineering | Docker Compose, GitHub Actions, Vercel | Local services, automated checks and hosted deployment |

The public game runs on Vercel with private API/AI service connections and Neon persistence. Local development uses Docker Compose. Architecture, API contracts and deployment boundaries are documented in the [system design](docs/architecture/system-design.md), [API reference](docs/api/README.md) and [release readiness](docs/release-readiness-matrix.md).

## Development and verification

For prerequisites and safe local setup, follow the [development guide](docs/development.md). Existing saves and private environment files must be preserved: consult the [Cloud Shell recovery runbook](docs/cloud-shell-pause-resume.md) before working with a previously used environment.

Validation includes unit and integration tests, API checks, migration checks, CI builds and campaign/artwork smoke tests. See [QA evidence](docs/release-qa.md) and the [acceptance worksheet](docs/final-qa-acceptance-worksheet.md) for dated results and limitations.

## Publication and usage rights

The five-chapter game and source repository were made publicly accessible for portfolio demonstration on November 21, 2026. Groq inference and database-backed limits operate in Production, but availability and free-tier capacity are not guaranteed. No formal `v1.0.0` release tag has been created. The 16+ advisory is not a government classification. See [release status](docs/release-readiness-matrix.md) and [classification guidance](docs/release-classification.md).

The owner authored and approved the narrative, game design and artistic direction. The twelve accepted scene illustrations were created with OpenAI image-generation assistance under the owner's direction, as recorded in [asset provenance](docs/assets.md). Development, review, testing and documentation also used AI assistance. The repository contains neither the private narrative manuscripts nor reference sheets or credentials. **Public visibility does not grant permission to reproduce, modify or redistribute the original code or artwork.** No general reuse license is provided. Third-party dependencies retain their respective licenses.
