# Documentation audit — November 19, 2026

## Scope and verified reference

Repository documentation reviewed against accepted runtime `14ea583` and the most recent owner Cloud Shell recovery evidence. The game campaign, rules and art are frozen. Owner-provided terminal evidence after VM recycling: validated final pause backup, **6 sessions / 0 pending generations / 4 migrations restored**, four healthy Compose services, browser Continue working; private Ollama has **not yet been reactivated** and server generation was deliberately set to `AMI_AI_GENERATION=0`. The GitHub main had additional documentation-only changes; it does not require rebuilding the owner-approved game images. No public deployment or mandatory paid resources.

This audit records the first cleanup; a later follow-up further separated current development instructions from [archived history](development-history.md), centralized the repeated [PR #38 snapshot](history-pr38-snapshot.md), and moved the completed [VM-return checklist](release-readiness-history.md) out of the active [release matrix](release-readiness-matrix.md). Historical sections that remain inside design/implementation documents are marked as such and do not override the accepted runtime. The audit covers all tracked Markdown files present at the pre-audit checkpoint (README, AGENTS, CI template and documentation), not the private canonical source PDFs or a full browser/security certification. Changes in the audit PR are restricted to documentation and a read-only local-link audit in CI; no code implementing the game, no save, migration, content, probability, art or deployment is changed.

## Findings and resolutions

| Scope | Finding | Resolution / status |
| --- | --- | --- |
| Entry point | README was formerly a dated PR diary rather than a project introduction | Corrected by [PR #57](https://github.com/AlexandroLeao/ami-108/pull/57); no runtime changes |
| Architecture, narrative and AI reference documents | Many contained one duplicated PR #38 *current baseline* with obsolete 201-test figures, stale first two-session restore, and pre-pause directives | Recast those exact paragraphs as **historical PR #38 snapshots**; point to [current readiness](release-readiness-matrix.md) for the accepted 221-test runtime and actual six-session recovery |
| Development and operations | Older commands for installing PR #41/42, previous checkpoints and past shutdown states appeared beside the new runbook | Put current verified recovery first, explicitly archive old instructions and direct current operations to [safe Cloud Shell recovery](cloud-shell-pause-resume.md); do not restore an already populated database |
| Chapter 3 and encounters | Early drafts still described later AI/BOAR/FR3 as future implementation despite being completed | Label historic criteria and plans as fulfilled; preserve all owner-approved canonical dialogue, IDs, original art and rules |
| UI and accessibility | Old three-page Extras preview and an earlier security baseline could appear current | Identify the approved **four-page Extras** and frozen presentation; align the QA reference to approved runtime; automated screen-reader/reduced-motion testing remains open |
| Dependency advisories | Pre-remediation critical/high scan was first on the page, obscuring later targeted remediation | Label initial scan historical and surface the **recorded** later zero-known JS and Python audit results; new OS/container/advisory review is still required |
| Source precedence | AGENTS previously cited earlier Master/Script as the current authoritative documents | Clarified private Master v1.14 and Script v1.12 plus explicit later owner-approved amendments; no private story content imported into GitHub |
| Documentation links | Relative links can silently rot | Add tracked-Markdown relative-path validator and fixture coverage to CI; ignore external URLs and code fences; **this is not a full Markdown parser or external link verifier** |

## Traceability and boundaries

- Current implementation and acceptance facts: [README](../README.md), [release QA](release-qa.md), [AI evaluation history](ai-local-evaluation.md), [release readiness](release-readiness-matrix.md).
- Old dated source excerpts, measurements, proposed plans, scripts and PR snapshots remain as historical evidence. Their commands must not override accepted local runtime, private source revisions, validated backup status, or the safe operational recovery guide.
- Do not infer official 16+ classification, public production readiness, a universal model-latency SLA or a zero-cost public hosting commitment.
- Still open: [#12](https://github.com/AlexandroLeao/ami-108/issues/12) browser accessibility/performance and production security, [#13](https://github.com/AlexandroLeao/ami-108/issues/13) deployment choice, [#14](https://github.com/AlexandroLeao/ami-108/issues/14) private-source synchronization/final documentation, [#15](https://github.com/AlexandroLeao/ami-108/issues/15) explicit release authorization.
- The next infrastructure step is **separate Ollama reactivation** on the owner VM using an internal-only private network, pinned image/model, bounded memory and 10-case real-provider regression **before** enabling the API generation flag. Do not touch the six restored saves in provider testing.
