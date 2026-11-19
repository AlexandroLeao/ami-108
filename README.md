# AMI-108

## Current project status

**Latest accepted runtime — November 19, 2026:** The owner approved the complete five-chapter PT-BR/EN campaign, all twelve original scene assets, desktop/mobile presentation, and the fresh-game RANDOM response variety in PR #53. Local Cloud Shell game/runtime commit: `14ea583`. After PR #54, the private GitHub `main` is `99bbf8e` (documentation-only; no local rebuild required). The exact [PR #53 CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44603955413) and [main CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44606120570) passed **221 automated tests** (105 API, 44 Web, 72 Python), Prisma schema/migrations, lint/types/build, complete built campaign and all 12 image hashes. [PR #54 post-merge CI](https://github.com/AlexandroLeao/ami-108/actions/runs/44609150270) also passed both jobs.

**Local inference:** The pinned, local-only Qwen2.5:1.5b was verified resident, with 7/7 new preview game generations validated and two distinct RANDOM consultation texts each for DOG and RAT; fresh port-3000 gameplay was accepted by the owner. `Continue` intentionally reuses previously persisted responses. Installation evidence confirmed five saved sessions and zero pending generations at installation, four healthy services and a verified prior database dump. The owner has since closed Cloud Shell for a pause, but the final shutdown dump and container stop report have not been supplied for independent verification. Do not infer persistent VM/Docker volumes from the pause.

**Release status:** Full campaign accepted **does not mean publicly released**. Four formal issues remain open: [#12 security/QA](https://github.com/AlexandroLeao/ami-108/issues/12), [#13 zero-cost deployment](https://github.com/AlexandroLeao/ami-108/issues/13), [#14 final documentation](https://github.com/AlexandroLeao/ami-108/issues/14), and [#15 release approval](https://github.com/AlexandroLeao/ami-108/issues/15). See [release readiness and blocker matrix](docs/release-readiness-matrix.md), [safe Cloud Shell pause/resume](docs/cloud-shell-pause-resume.md), and [release QA](docs/release-qa.md). No public hosting, license decision, paid resources or `v1.0.0` tag is claimed. The mandatory cost target remains R$ 0.
---


A retrofuturistic narrative survival game featuring an AI-powered robot companion with corrupted memories. An original, non-profit project. Content warning: violence, blood, strong language and horror; provisional editorial recommendation 16+, official age rating pending.

**Historical baseline:** PR #22 accepted Chapters 1–2; superseded by the PR #25 status above.

## Product

A short, static 2D web narrative with five chapters, twelve narrative scenes, three encounters, a single campaign ending and PT-BR/EN localization. David and AMI-108 navigate a post-apocalyptic world through dialogue, choices and memory restoration.

## Implemented architecture and planned infrastructure

- `apps/web`: Next.js, React, TypeScript, Tailwind CSS.
- `apps/api`: NestJS, Prisma, PostgreSQL; authoritative narrative state and game rules.
- `services/ai`: Python, FastAPI, Pydantic; authorized retrieval, controlled generation and validation.
- `docs/`: technical documentation, decisions and tests.
- `compose.yaml`: private local Docker Compose stack; `infra/` contains Docker build files. AWS/OpenTofu remains conditional and unprovisioned.

The game must remain playable using authored fallbacks when the AI provider is unavailable. Real AI integration is a project deliverable, not replaced by fallback-only behavior.

## Development

The repository is currently private. See [development setup](docs/development.md) for environment setup, initial dependency resolution, tests and Compose instructions. The bootstrap was merged in PR #16 after successful CI, four-container startup and Google Cloud Shell preview. No credentials, private documentation, or unapproved assets should be committed. See [AGENTS.md](AGENTS.md) for project constraints.

The canonical private narrative sources are Documento Mestre v1.14 and Roteiro Interativo v1.12, supplemented by the owner-approved Chapter 5 amendments in PR #38. Private source synchronization is pending. AMI-108 is the approved project and game title. See the [production plan](docs/production-plan.md) for the seven-day target and release gates.

## Approved game interface

- [UI specification and opening sequence](docs/ui-design.md)
- [Scene asset preparation and local preview](docs/assets.md)
- [Narrative engine implementation status](docs/narrative-engine.md)

The owner approved the opening preview on desktop and mobile; PR #18 merged after CI passed. The local root uses the persisted five-chapter campaign API; the isolated visual fixture remains at `/preview`. Continue game is enabled only when a saved session is confirmed. The owner accepted the Chapter 1 playtest refinements; post-merge [CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passed. See the narrative engine for verification limits and next steps.

## Architecture specification

- [Requirements and traceability](docs/architecture/requirements.md)
- [System design and diagrams](docs/architecture/system-design.md)
- [Domain model and invariants](docs/architecture/domain-model.md)
- [Architecture decisions](docs/architecture/decisions.md)
- [Local API contracts](docs/api/README.md)

See [release QA evidence and remaining gates](docs/release-qa.md) for implemented behavior, source review and outstanding verification. The architecture diagrams retain historical design context.

## Portfolio summary

AMI-108 is an original interactive narrative project combining a responsive Next.js frontend, a deterministic NestJS state machine, PostgreSQL persistence and a constrained local FastAPI/Ollama inference service. The owner designed and approved the narrative, visual direction and rules; implementation, review and documentation were developed with AI assistance. The model selects only authorized alternatives; gameplay outcomes remain deterministic. The complete campaign has passed automated and owner playtest gates; production deployment, release-level security, accessibility and licensing remain open. No public release or paid infrastructure is claimed.

## Collaboration

Short-lived branches, reviewable pull requests, explicit acceptance criteria and reproducible tests. The project owner approves changes before merge. New services must respect the R$ 0 mandatory-cost constraint.

Repository documentation, issue and PR text, commits, code identifiers and comments are written in English. Official private documents and owner-facing reports are in Portuguese; in-game content remains PT-BR/EN.

License and asset distribution terms are not yet decided.

## Archived development milestones (historical, superseded)

The notes below document earlier stages only. The latest accepted status above takes precedence; do not use historical next steps as current instructions.

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.

Next: AMI-007 authorized inference/RAG and AMI-008 Chapter 3, with remaining AMI-006 persistence/restoration work. See [encounter engine](docs/encounter-engine.md) and [production plan](docs/production-plan.md).

Day 2 continuation: AMI-005 #7 is closed completed; AMI-006 #8 has its first two criteria met, third remains open. Private documents synchronized in place; no private source or artwork changes in the repository. Next AMI-007 and AMI-008.
