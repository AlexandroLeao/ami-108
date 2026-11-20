# AMI-108 documentation index

> **Current status guide — November 19, 2026.** This is a navigation and precedence guide, not public release approval. The authoritative accepted gameplay remains the privately tested five-chapter runtime `14ea583`; later GitHub revisions contain documentation and guarded recovery tooling. The last confirmed recovered Cloud Shell run preserved **6 sessions, 0 pending generations, 4 Prisma migrations** and passed Continue; the resident pinned model passed **10/10 real bilingual direct checks** and guarded API-only activation confirmed **gameplay AI ON**, all three endpoints healthy and Continue intact. A separate-browser new-game AI E2E check remains pending. See [release readiness](release-readiness-matrix.md) for what remains open.

## 1. Start here: current state and operations

| Source | Purpose | Status |
| --- | --- | --- |
| [Project overview](../README.md) | Game and stack, current private approval | Current entry point |
| [Release-readiness matrix](release-readiness-matrix.md) | Verified evidence, issues #12–#15, next action | **Current operational status** |
| [Development guide](development.md) | Safe checks, stack basics and local constraints | **Current, no obsolete restore steps** |
| [Cloud Shell pause/resume](cloud-shell-pause-resume.md) | Archive integrity, six-save recovery, protected AI preparation | Current reference with *explicitly historical* prior pause command |
| [Release QA](release-qa.md) | CI and owner evidence vs missing independent/browser tests | Current evidence register; dated sections may be historical |
| [Accessibility/performance QA](accessibility-performance-qa.md) | Tests still required before public launch | **Plan**, not pass certificate |
| [Production security gates](architecture/production-security-gates.md) | Proposal of required controls, not yet enabled | **Proposal, not deployment** |
| [Dependency security audit](dependency-security-audit.md) | Earlier vulnerability findings and recorded remediation | **Dated scan evidence**, not a current vulnerability warranty |

## 2. Implemented design and original authoring constraints

| Documentation | Applies to |
| --- | --- |
| [Architecture requirements](architecture/requirements.md) | Functional/nonfunctional scope and traceability |
| [System design](architecture/system-design.md) | Game services, boundaries and diagrams |
| [Domain model](architecture/domain-model.md) | Checkpoints, state invariants and persistence |
| [Architecture decisions](architecture/decisions.md) | ADRs, security and local-first choices |
| [API contracts](api/README.md) | Implemented local endpoint contracts and verification limits |
| [Narrative engine](narrative-engine.md) | Stable story IDs, events and accepted five-chapter mechanics |
| [Encounter engine](encounter-engine.md) | DOG/RAT/BOAR, energy and immutable consultation slots |
| [UI design](ui-design.md) | Accepted cinematic presentation and four-page Extras |
| [Scene assets](assets.md) | Twelve approved images and art-preparation workflow |
| [Chapter 3 details](chapter-three.md) | Approved chapter and historical implementation history |
| [AI authorization](ai-rag.md) | Bounded responses and provider design; earlier milestones are historical |
| [Local AI evaluation](ai-local-evaluation.md) | Real and simulated test history and separate model-reactivation gates |

**Source precedence and synchronization caveat:** The last synchronized private files are **Documento Mestre v1.14** and **Roteiro Interativo v1.12**, but their Day 3 status sections still describe **4/5 chapters completed** and Chapter 5 as a draft. They are **not a complete standalone record of the subsequently accepted five-chapter game**. Later explicitly owner-approved amendments and tested merged implementation take precedence where those files predate acceptance. A reviewed private-source reconciliation remains **open in issue #14**; do not silently rewrite narrative or publish the private files. The approved application code and tested owner acceptance determine implemented behavior. [AGENTS.md](../AGENTS.md) provides engineering constraints. Nothing in a dated PR/design excerpt overrides those sources or authorizes new scenes, dialogue, art, rules, public release or paid hosting.

## 3. Archived records — not current installation instructions

| Archive | Contains |
| --- | --- |
| [Historical developer handoffs](development-history.md) | Original Day 1–4 developer log and outdated one-time setup/restore instructions; **do not execute** |
| [Historical initial VM-return checklist](release-readiness-history.md) | First recovery checklist, **already completed** for six saved sessions |
| [PR #38 status snapshot](history-pr38-snapshot.md) | One preserved source for a formerly repeated 201-test and early-save milestone |
| [Documentation audit](documentation-audit.md) | Findings, scope and cleanup of historical/current distinctions |
| [Production plan](production-plan.md) | Original seven-day target, chronology and remaining release conditions |

Implementation design documents may also preserve **clearly marked dated milestones** for code traceability. Those subsections are not an instruction to roll back a completed chapter, run an old model benchmark on player data, reset a save, or reopen a previously closed issue.

## 4. Verification and remaining limits

- GitHub CI checks tracked internal Markdown link **paths**; it does not check external websites, every Markdown anchor, a private PDF's semantic correspondence, or full accessibility/production security.
- The previously accepted PR #53 game suite passed 105 API + 44 Web + 72 Python = **221** tests and a full campaign/12-artwork-hash smoke. Separate operational/doc tests were added later. These tests **do not** prove model readiness on a newly recycled VM.
- The pinned local Qwen2.5:1.5b and Ollama must be checked on the actual Cloud Shell hardware with real ten-case validation before gameplay generation is enabled. A GitHub-green recovery script is not evidence it already ran.
- The repository remains private and has **no public-hosting, license, content-rating or release approval**. Issues [#12](https://github.com/AlexandroLeao/ami-108/issues/12), [#13](https://github.com/AlexandroLeao/ami-108/issues/13), [#14](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15](https://github.com/AlexandroLeao/ami-108/issues/15) remain open.
