# AMI-108

## Current project status

**Current accepted baseline — November 18, 2026:** Chapter 4 PR #28 merged at `176e8c1` after final desktop/mobile owner acceptance; documentation PR #27 merged at `0ed9961`. [Exact-head Chapter 4 CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44390775809) passed including PostgreSQL, build and HTTP smoke through the Chapter 5 card. Chapters 1–4 approved (4/5 = 80% of chapters); formal AMI progress remains 7/13 (53.8%), because #8 and #11 still require CP-BOAR and Chapter 5. F3 restores all four memory indexes and energy atomically, with PERSONAL unlocked. All original artwork retained. Private Master v1.13 / Script v1.11 plus later owner-approved amendments are authoritative. AI real inference is integrated and evaluated, not active in the accepted fallback-only installation or Chapter 4 preview. Fresh RANDOM diversity and live provider feasibility remain release follow-up #29; the 2-CPU VM returned 5/20 within budget versus 20/20 on the earlier 4-CPU VM. Cloud Shell port 3000 needs a verified backup and controlled update from `d587be9`; no new migration is required. Next: draft PR #30 for Chapter 5, then full campaign/AI QA, deployment and release. No paid resources authorized.

---


A retrofuturistic narrative survival game featuring an AI-powered robot companion with corrupted memories.

**Historical baseline:** PR #22 accepted Chapters 1–2; superseded by the PR #25 status above.

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

The canonical narrative sources are Documento Mestre v1.13 and Roteiro Interativo v1.11 (private backup). AMI-108 is the approved project and game title. See the [production plan](docs/production-plan.md) for the seven-day target and release gates.

## Approved game interface

- [UI specification and opening sequence](docs/ui-design.md)
- [Scene asset preparation and local preview](docs/assets.md)
- [Narrative engine implementation status](docs/narrative-engine.md)

The owner approved the opening preview on desktop and mobile; PR #18 merged after CI passed. The local root now uses the persisted Chapters 1–2 campaign API; the isolated visual fixture remains at `/preview`. Continue game is enabled only when a saved session is confirmed. The owner accepted the Chapter 1 playtest refinements; post-merge [CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passed. See the narrative engine for verification limits and next steps.

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

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.

Next: AMI-007 authorized inference/RAG and AMI-008 Chapter 3, with remaining AMI-006 persistence/restoration work. See [encounter engine](docs/encounter-engine.md) and [production plan](docs/production-plan.md).

Day 2 continuation: AMI-005 #7 is closed completed; AMI-006 #8 has its first two criteria met, third remains open. Private documents synchronized in place; no private source or artwork changes in the repository. Next AMI-007 and AMI-008.
