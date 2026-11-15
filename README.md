# AMI-108

A retrofuturistic narrative survival game featuring an AI-powered robot companion with corrupted memories.

**Status:** pre-production complete; technical foundation in progress. No playable build or completed deployment yet.

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

The repository is currently private. See [development setup](docs/development.md) for environment setup, initial dependency resolution, tests and Compose instructions. The bootstrap remains under review until runtime verification passes. No credentials, private documentation, or unapproved assets should be committed. See [AGENTS.md](AGENTS.md) for project constraints.

The canonical narrative sources are Documento Mestre v1.8 and Roteiro Interativo v1.6 (private backup). AMI-108 is the approved project and game title. See the [production plan](docs/production-plan.md) for the seven-day target and release gates.

## Collaboration

Short-lived branches, reviewable pull requests, explicit acceptance criteria and reproducible tests. The project owner approves changes before merge. New services must respect the R$ 0 mandatory-cost constraint.

Repository documentation, issue and PR text, commits, code identifiers and comments are written in English. Official private documents and owner-facing reports are in Portuguese; in-game content remains PT-BR/EN.

License and asset distribution terms are not yet decided.
