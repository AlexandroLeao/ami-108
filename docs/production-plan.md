# Production plan

**Project:** AMI-108  
**Planning baseline:** November 15, 2026  
**Production target:** November 16–22, 2026 (seven calendar days).  
**Canonical sources:** Documento Mestre v1.11 and Roteiro Interativo v1.9, retained privately.  
**Status:** AMI-001 completed ahead of schedule on November 15: PR #16 merged, final CI passed, four Compose services healthy and preview validated. AMI-002 and AMI-003 completed on November 16 (PRs #17 and #18 merged; owner accepted desktop/mobile preview). AMI-004 started on Day 1 ahead of the original Day 2 target; PR #19 merged the pure narrative core at `5fa75b6`. PR #20 merged the owner-approved local Chapter 1 campaign (75 presentation beats) and prerequisite AMI-006 session persistence at `3cf942a`; post-merge CI passed. AMI-004 issue #6 closed on November 17. No full campaign or real inference yet.

The target is ambitious, not a guaranteed release date. Preserve all approved requirements; record blockers and revise the schedule rather than silently reducing scope. Work is performed in active development sessions, not autonomously between them.

| Day | Date | Work | Exit gate |
| --- | --- | --- | --- |
| 1 | Nov 16 | AMI-002, 003: architecture, requirements, asset pipeline and initial UI; AMI-001 already completed | Reviewed architecture/contracts, verified initial narrative interface and prepared assets |
| 2 | Nov 17 | AMI-004, 005, 006: narrative engine, localization, Chapters 1–2, dog encounter and persistence | Playable vertical slice with energy, four choices, checkpoint, F1 and SOL-01 |
| 3 | Nov 18 | AMI-006, 007, 008: persistence, real AI/RAG and Chapter 3 | Real inference and fallback evidence; rat, F2 and SOL-02; durable session/cache |
| 4 | Nov 19 | AMI-009: Chapters 4–5 | F3, personal archives, flashbacks, boar, launch and complete bilingual campaign |
| 5 | Nov 20 | AMI-010: quality and security | Critical behavior, AI, accessibility, performance and security checks passed |
| 6 | Nov 21 | AMI-011, 012: deployment and technical documentation | Reproducible deployment where free conditions are verified; evidence and documentation |
| 7 | Nov 22 | AMI-013: release validation | Owner approves v1.0.0 only after mandatory release gates pass |

Day 1 acceptance: #2, #4 and #5 closed. Chapter 1 integration and owner playtest accepted; PR #20 merged at `3cf942a` with [post-merge CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passing. AMI-004 issue #6 is closed after owner acceptance; AMI-006 issue #8 remains open for checkpoints, consultation slots, restoration and solar events. Next implementation: AMI-005 and remaining AMI-006 work for Chapter 2. The Day 2–7 targets and release gates are unchanged. See [narrative core](narrative-engine.md).

Tests, security, documentation and deployment preparation start early. Evaluate provider access and costs on day 1; use authored fallback for development, not as a substitute for demonstrating real AI.

## Working agreement

- Owner sets priorities and acceptance criteria, approves architecture and merges, validates the game, authorizes external services.
- AI assistance produces implementation, tests, review and documentation during active sessions. Report real commands, results and limitations.
- GitHub is the technical source of truth. Use short branches and PRs with linked issues; close an issue only when its acceptance criteria pass.
- Use English for repository materials and code. Preserve official Portuguese documents and bilingual game content.
- Google Cloud Shell is the verified environment for manual execution and preview; GitHub Actions for CI. Codespaces is optional and untested. AWS CloudShell is for authorized AWS operations only. Maintain zero mandatory service cost, verify quotas before provisioning, and never commit secrets.
- Keep the repository private until licensing, assets, spoilers, credentials and publication have been reviewed by the owner.

## Release gates

- Five chapters, twelve narrative scenes, twelve approved scene images, two languages, four David memory transitions and one campaign ending.
- Three encounters, twelve choices (nine lethal, three safe), three checkpoints, two solar recharges and three memory restorations; idempotent and durable game state.
- Real LLM integration, authorized fact retrieval, category selection by NestJS, validated localized output, persistent consultation cache, tested fallbacks and spoiler/cost controls.
- Next.js, NestJS, FastAPI, Prisma/PostgreSQL, Docker Compose, CI/CD; unit, integration, contract and E2E evidence; accessibility, performance and security validation.
- Reproducible execution, verified free deployment conditions, AWS integration only when authorized and viable; clearly distinguish simulation from real deployment.
- No unresolved critical defects, owner approval, and honest documentation. No release solely because the target date has arrived.
