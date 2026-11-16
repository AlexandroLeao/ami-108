# AMI-108

A retrofuturistic narrative survival game featuring an AI-powered robot companion with corrupted memories.

**Status:** technical foundation, architecture and approved visual/asset foundation complete (AMI-001–003). Chapter 1 narrative core merged in PR #19; the owner-approved persistent Chapter 1 campaign (75 presentation beats, PT-BR/EN), API and interface merged in PR #20 at `3cf942a` on November 16, 2026. AMI-004 implementation is accepted; formal issue #6 closure remains pending. AMI-006 is partial. No full campaign, completed deployment or real inference.

## Product

A short, static 2D web narrative with five chapters, twelve narrative scenes, three encounters, a single campaign ending and PT-BR/EN localization. David and AMI-108 navigate a post-apocalyptic world through dialogue, choices and memory restoration.

## Planned architecture

- `apps/web`: Next.js, React, TypeScript, Tailwind CSS.
- `apps/api`: NestJS, Prisma, PostgreSQL; authoritative narrative state and game rules.
- `services/ai`: Python, FastAPI, Pydantic; authorized retrieval, controlled generation and validation.
- `packages/`: shared contracts/configuration where justified.
- `docs/`: technical documentation, decisions and tests.
- `infra/`: Docker Compose and conditional AWS/OpenTofu integration.

The game must remain playable using authored fallbacks when the AI provider is unavailable. Real AI integration is a project deliverable, not replaced by fallback-only behavior.

## Development

The repository is currently private. See [development setup](docs/development.md) for environment setup, initial dependency resolution, tests and Compose instructions. The bootstrap was merged in PR #16 after successful CI, four-container startup and Google Cloud Shell preview. No credentials, private documentation, or unapproved assets should be committed. See [AGENTS.md](AGENTS.md) for project constraints.

The canonical narrative sources are Documento Mestre v1.10 and Roteiro Interativo v1.8 (private backup). AMI-108 is the approved project and game title. See the [production plan](docs/production-plan.md) for the seven-day target and release gates.

## Approved game interface

- [UI specification and opening sequence](docs/ui-design.md)
- [Scene asset preparation and local preview](docs/assets.md)
- [Narrative engine implementation status](docs/narrative-engine.md)

The owner approved the opening preview on desktop and mobile; PR #18 merged after CI passed. The local root now uses the Chapter 1 campaign API; the isolated visual fixture remains at `/preview`. Continue game is enabled only when a saved session is confirmed. The owner accepted the Chapter 1 playtest refinements; post-merge [CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passed. See the narrative engine for verification limits and next steps.

## Architecture specification

- [Requirements and traceability](docs/architecture/requirements.md)
- [System design and diagrams](docs/architecture/system-design.md)
- [Domain model and invariants](docs/architecture/domain-model.md)
- [Architecture decisions](docs/architecture/decisions.md)
- [Proposed API contracts](docs/api/README.md)

These are design specifications, not implemented gameplay or inference evidence.

## Collaboration

Short-lived branches, reviewable pull requests, explicit acceptance criteria and reproducible tests. The project owner approves changes before merge. New services must respect the R$ 0 mandatory-cost constraint.

Repository documentation, issue and PR text, commits, code identifiers and comments are written in English. Official private documents and owner-facing reports are in Portuguese; in-game content remains PT-BR/EN.

License and asset distribution terms are not yet decided.
