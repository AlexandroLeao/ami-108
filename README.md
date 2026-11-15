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

The repository is currently private. Environment setup and executable instructions will be added with the bootstrap implementation. No credentials, private documentation, or unapproved assets should be committed. See [AGENTS.md](AGENTS.md) for project constraints.

The canonical narrative sources are Documento Mestre v1.7 and Roteiro Interativo v1.5 (private backup). The project name AMI-108 was selected during planning; the source documents will be revised after the production plan is approved.

## Collaboration

Short-lived branches, reviewable pull requests, explicit acceptance criteria and reproducible tests. The project owner approves changes before merge. New services must respect the R$ 0 mandatory-cost constraint.

License and asset distribution terms are not yet decided.
