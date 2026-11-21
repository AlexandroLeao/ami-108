# AMI-108 documentation index

**Purpose:** Navigation, ownership and source precedence. **Not** a release certificate, chronological log, deployment approval or database recovery command. For the actual current project state, use the [release-readiness matrix](release-readiness-matrix.md); for the original game overview, see the [root README](../README.md).

The five-chapter private campaign has an approved game runtime; the current VM, latest safe pause, retained backup and outstanding release decisions are recorded **only** in [release readiness](release-readiness-matrix.md). Older checkpoints are intentionally historical, not competing operating instructions.

## Current operating references

| Document | Owns | Boundary |
| --- | --- | --- |
| [Release readiness](release-readiness-matrix.md) | Current evidence, checkpoint, issue #12–#15 status and next action | **Single status source of truth** |
| [Documentation standards](documentation-standards.md) | Writing rules, ownership, evidence, history and PR review gates | **Maintenance policy** |
| [Development guide](development.md) | Dependencies, repository layout, approved local runtime and safe development workflow | No unconditional restore/reinstall |
| [Cloud Shell pause/resume](cloud-shell-pause-resume.md) | Preserve saves, inspect Docker VM, backup verification, safe return and pause | **Operational runbook**; never restore into a nonempty DB |
| [Release QA](release-qa.md) | Dated validation results, regressions and concrete limitations | Historical observations are dated, not fresh certificates |
| [Final QA worksheet](final-qa-acceptance-worksheet.md) | Manual accessibility, security, performance and owner acceptance gates | Checklist, **not** evidence already passed |
| [Hosting assessment](zero-mandatory-cost-hosting-assessment.md) | Dated free-tier research behind the chosen topology | **Historical feasibility assessment**, not current live state |
| [Accessibility and performance](accessibility-performance-qa.md) | Test cases and expected behavior | Plan pending real device/screen-reader checks |
| [Production security gates](architecture/production-security-gates.md) | Origin, ingress, quotas, retention and network controls | Daily budget code **merged, not migrated**; Vercel WAF Hobby enforcement unverified; public release pending |
| [Dependency audit](dependency-security-audit.md) | Dated advisories, prepublication Git history pattern scan and limitations | No perpetual security, rights or secret-history certification |
| [Brazilian game classification](release-classification.md) | Official MJSP/IARC paths, owner procedure and rating-display boundaries | No official classification has been obtained |

## Implementation and design

| Document | Owns |
| --- | --- |
| [Requirements](architecture/requirements.md) | Functional scope and traceability |
| [System design](architecture/system-design.md) | Services, boundaries and architecture diagrams |
| [Domain model](architecture/domain-model.md) | Session, checkpoint and persistence invariants |
| [Architecture decisions](architecture/decisions.md) | Accepted technical ADRs |
| [API contracts](api/README.md) | Local wire and endpoint contracts |
| [Narrative engine](narrative-engine.md) | Approved state IDs, transitions and five-chapter behavior |
| [Encounter engine](encounter-engine.md) | DOG/RAT/BOAR rules, categories, energy and immutable slots |
| [Chapter 3 notes](chapter-three.md) | Accepted specific scene implementation and dated provenance |
| [UI design](ui-design.md) | Approved presentation, localization, warning and Extras |
| [Assets](assets.md) | Original scene images and asset workflow |
| [AI/RAG](ai-rag.md) | Server-bounded facts, generation authorization and fallbacks |
| [Optional cloud inference evaluation](cloud-inference-evaluation.md) | Proposed Workers AI connector, privacy/cost gates, local/offline tests and provider-acceptance plan | **Not activated / no deployment** |
| [Groq Free inference evaluation](groq-inference-evaluation.md) | Strict model contract, quotas, provider/runner and protected Vercel/Neon evidence | Hosted PT-BR/EN QA verified; **not** public Production approval |
| [Local AI evaluation](ai-local-evaluation.md) | **Dated** real-model evaluation and activation history |

## Historical and audit references

| Record | Purpose |
| --- | --- |
| [Development history](development-history.md) | Archived older development and setup instructions; **do not rerun** |
| [Cloud Shell pause history](cloud-shell-pause-history.md) | Archived earlier restoration, model installation and pause commands; **not current operations** |
| [Initial VM-return history](release-readiness-history.md) | Completed older six-save return checklist |
| [PR #38 snapshot](history-pr38-snapshot.md) | One preserved dated campaign milestone |
| [Production plan](production-plan.md) | Original seven-day schedule and historical planning assumptions; current release gates live in release readiness |
| [Documentation audit](documentation-audit.md) | Audit scope, cleanup findings and unresolved semantic-source work |

## Private sources, precedence and what the checks mean

The private **Documento Mestre v1.14** (PDF/Markdown) and **Roteiro Interativo v1.12** (PDF) describe the *November 18 Day 3* checkpoint of **4/5 chapters**, before the approved final chapter. Their original authored passages must stay private and unchanged until the owner approves reconciliation. The later **explicitly owner-approved** five-chapter changes and accepted game implementation govern observed runtime behavior; the old files do not authorize new story content. Issue [#14](https://github.com/AlexandroLeao/ami-108/issues/14) covers synchronized private revision approval.

CI checks tracked local links, Markdown headings/fences, basic editorial duplication/ownership rules, ADR completeness and OpenAPI JSON/operation structure, plus obvious tracked private-file names. These checks do **not** validate external URLs, complete schema conformance, private PDF parity, factual historical truth, WCAG, hidden secrets, or public security. Manual review and separate release gates remain required.

Repository engineering rules are in [AGENTS.md](../AGENTS.md); the [documentation policy](documentation-standards.md) defines the next review baseline. No document grants permission to expose the game, publish spoilers, change the approved rules, incur mandatory costs, delete saves or create a `v1.0.0` release without authorization.
