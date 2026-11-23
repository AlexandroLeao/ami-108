# AMI-108 — Engineering instructions

## Authority and approved baseline

- The **owner-approved local game runtime is `14ea583a83c7c1473bc94f3b1d515a8497827ac3`**. All five chapters and their final original artwork, gameplay, dialogue, presentation, probability rules and replay are frozen. **Do not change them without the owner's specific consent.**
- Private **Documento Mestre v1.14**, **Roteiro Interativo v1.12**, and later explicitly owner-approved campaign amendments govern narrative precedence. The two private documents describe a November 18 historical 4/5 milestone until separately reconciled; do not treat their older status header as today's gameplay scope or import the original sources into Git.
- The game and repository are publicly accessible for portfolio demonstration, while the accepted Cloud Shell runtime remains a separate frozen local checkout. GitHub `main` contains later documentation and guarded tooling; **do not fast-forward the accepted local runtime just to read docs**. See [release readiness](docs/release-readiness-matrix.md) for the current scope.
- The current VM/backup, outstanding issues and release boundary have a **single source of truth**: [release readiness](docs/release-readiness-matrix.md). Last verified owner shutdown completed with a **seven-session backup and four stopped Compose services**, generation OFF and no Ollama on that replacement VM.
- This file governs engineering behavior; editorial document ownership and review rules are in [documentation standards](docs/documentation-standards.md).

## Frozen gameplay and presentation invariants

- The five chapters are **Bananas**, **Registro Atualizado**, **Pensamento Positivo**, **AMI-108 & David** and **De nada, Bobo**. Preserve twelve approved narrative scene IDs, twelve original scene illustrations, nine internal reference sheets and the existing single ending. No new story events, spoilers, alternative endings or artwork.
- Next.js renders **only** the authorized current view. NestJS controls all commands, session state, choices, random category selection, energy, memories, checkpoints, saved receipts, replay and current-asset gates. The server never delegates outcomes, correct answers or probabilities to the model.
- Encounter order: **DOG** (Chapter 2), **RAT** (Chapter 3), **BOAR** (Chapter 5). Each has four deterministic choices, one safe and three lethal. The lizard appears only in flashback. BOAR information is **authored CORRECT**, never a generative model result.
- After E-JOIN, energy starts at three. Each authorized encounter consultation debits at most one energy, once; at most three per attempt. Zero energy never prevents taking a choice. Ordinary dialogue, memory, flashback and intro generation do not debit energy.
- **F1/F2/F3 atomically** restore energy to three with the specified memories. After F3, all four indices reach 100% and PERSONAL unlocks; no added solar-charging actions. Preserve legacy SOL cursor compatibility.
- Checkpoint retries roll back only reversible gameplay; immutable consultation slots/categories/cache are preserved. Duplicate commands must never double-debit or reroll. Locale changes do not change a persisted response; limit nine encounter slots plus one INTRO-RANDOM per run.
- AMI generation is optional and authenticated through typed FastAPI requests, strictly allowlisted facts, time limits and validation. Preserve localized authored fallback, cache and the rule that the model cannot access future scenes, player secrets or game authority. No free chat or arbitrary outside model provider without explicit approval.
- Keep approved eye-opening, dark narration, gated art reveal, dog/rat shake, Chapter 4 CRT/memory effects, one-shot name reveal, hidden Chapter 4 HUD, game frame dimensions and reduced-motion behavior. Preserve the final approved exact dialogue and timing, not intermediate proposed experiments. The owner-reviewed appearance is documented in [UI design](docs/ui-design.md).
- Content warning for violence, blood, language and horror is approved in PT-BR/EN; editorial **16+ is not an official classification**. Preserve its current pre-new-game and Extras behavior.
- Approved visual approach: original static 16:9 scene art, coded UI and palette `#171717`, `#FDF3E9`, `#FC2721`. Do not introduce audio, inventory, free movement, real-time combat, animated sprites or a second ending.

## Engineering and operations

- Keep the authoritative application layering: **Web/Next.js**, **API/NestJS/Prisma**, **AI/FastAPI**, **PostgreSQL** and optional **pinned internal-only Ollama**. Preserve bounded provider requests and deterministic fallback.
- Use stable identifiers, dependency lockfiles, small reviewable changes, real tests and reproducible commands. Add unit/integration/contract tests for implementation changes; use disposable test state rather than owner saves.
- Before operations on Cloud Shell, read the [safe pause/resume runbook](docs/cloud-shell-pause-resume.md). Never restore into a populated DB, delete named volumes or backups, blindly prune Docker, bypass free-disk checks or overwrite `.env`. Model downloads, migrations and network exposure need reviewed preconditions.
- Keep secrets, reference sheets, private source documents, cookies and database archives **outside Git and PR comments**. Run QA with sanitized evidence; redaction and filename checks alone do not certify confidentiality.
- The public Vercel/Neon/Groq deployment was separately accepted, with database-backed daily quotas. Local tests alone do **not** certify ingress security, traffic resilience, data retention, privacy, accessibility or source/art redistribution rights. See [production security controls](docs/architecture/production-security-gates.md).
- Google Cloud Shell is for private development, **not permanent public hosting**. The existing public deployment is owner-approved within the recorded portfolio scope. No additional deployment, paid resource, new provider, account creation, visibility change or `v1.0.0` tag without explicit owner approval.

## Documentation and PR workflow

- Repository-facing docs, issues, PRs, ADRs, commit messages, identifiers and comments are written in **clear English**; preserve exact PT-BR/EN game text. Use the [documentation standards](docs/documentation-standards.md): concise ownership, links instead of duplicate status paragraphs, dated evidence, and separated historical instructions.
- Review the targeted files and potential security/privacy impact; record **what was actually run** and known limitations. Do not represent CI, health endpoints, manual samples or prior-VM inference as public-release acceptance.
- Protect `main`: use scoped branches, reviewable PRs and CI. **Do not merge without explicit owner approval.** Do not modify approved game content to satisfy a documentation or deadline request.
- Issues [#12](https://github.com/AlexandroLeao/ami-108/issues/12), [#13](https://github.com/AlexandroLeao/ami-108/issues/13), [#14](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15](https://github.com/AlexandroLeao/ami-108/issues/15) are closed for their documented scopes. Any formal classification, licensing change or `v1.0.0` tag requires a separate decision.

## Historical acceptance records

Earlier interim instructions and Day 2 owner refinements were moved intact to [development history](docs/development-history.md). The applicable final presentation belongs to [UI design](docs/ui-design.md), [narrative engine](docs/narrative-engine.md), [encounter engine](docs/encounter-engine.md) and the approved runtime. The [PR #38 snapshot](docs/history-pr38-snapshot.md) is historical evidence, not a new instruction to change gameplay.
