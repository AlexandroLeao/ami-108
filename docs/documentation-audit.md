# Documentation audit — November 20, 2026

**Audit type:** complete version-controlled **technical documentation** editorial review, performed on a **draft GitHub branch**, not a production or private-canonical-source certification. The baseline is the owner-approved game runtime `14ea583`; later GitHub changes are editorial/operational and must not silently update the working game.

## Scope and method

Reviewed the root README and `AGENTS.md`, the tracked Markdown engineering/index/design/architecture/runbook/QA/security/history documents, the GitHub pull-request template, the two hand-maintained OpenAPI 3.1 JSON contracts and the existing documentation-related CI scripts. This scope excludes the unpublished private Master/Interactive Script, image rendering, running Cloud Shell or live player data.

The editorial method combines [Diátaxis document ownership](https://diataxis.fr/), [Google documentation and Markdown practices](https://google.github.io/styleguide/docguide/best_practices.html), and the [Microsoft ADR discipline](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record). The durable project-specific requirements are in [documentation standards](documentation-standards.md).

The inspection distinguished **current facts**, **accepted design**, **historical observations**, **proposed infrastructure**, **owner-reported manual tests** and **still-unverified release criteria**. Existing CI validates Git-tracked local links and Markdown boundaries. New editorial checks supplement those tests; neither static analysis nor this audit can establish factual truth for unobserved systems.

## Findings and applied corrections (draft PR)

| Severity | Finding | Correction |
| --- | --- | --- |
| High | Active status texts still described the empty pre-restoration Cloud Shell VM as current | Established [release readiness](release-readiness-matrix.md) as the **single owner** of the latest verified seven-session pause; removed duplicate archive filenames/status summaries from current navigation and developer guides |
| High | An active asset document proposed Docker image/cache deletion as a generic disk workaround | Replaced with **read-only diagnostics** and mandatory environment-specific review; preserved the old warning only as **archived, do-not-run history** |
| High | The active pause runbook still contained a copyable **AI-ON** shutdown command, incompatible with the successful **AI-OFF** pause | Replaced with a conditional, preflight-first runbook and linked the historical command from an explicitly non-executable archive |
| Medium | The status matrix mixed several previous recoveries, old operator instructions and current release decisions | Moved dated intermediate snapshots into [release history](release-readiness-history.md); retained only current evidence, pending issues and safe next decisions in the active matrix |
| Medium | Engineering agent instructions mixed hard rules with many older UI experiments and repeated Day 2 acceptance notes | Retained current frozen invariants in [AGENTS](../AGENTS.md); preserved original interim changes in [development history](development-history.md), with links to final approved UI/encounter references |
| Medium | ADR-007/008 appeared before ADR-001–006; some records lacked consistent context, alternatives and consequences | Ordered all eight [ADRs](architecture/decisions.md) and standardized status, context, decision, alternatives and consequences without proposing new gameplay features |
| Medium | Accessibility documentation risked implying per-locale or formal certification from owner-observed keyboard/200% zoom checks | Consolidated the evidence in the [QA worksheet](final-qa-acceptance-worksheet.md), explicitly separating reported passes, unrecorded environment and required screen-reader/performance work |
| Medium | Hosting documentation included unrelated career advice and described Vercel backend support imprecisely | Reframed the [hosting assessment](zero-mandatory-cost-hosting-assessment.md) around technical alternatives, free-tier/permission constraints, model privacy and **unapproved** architectural decisions |
| Medium | The latest backup filename and same long status paragraph were duplicated across several current documents | Kept the exact checkpoint only in release readiness and replaced duplications with descriptive relative links |
| Low | API, AI and architecture explanations mixed dated implementation milestones with live interface descriptions | Added short authoritative implementation boundaries and labeled dated prior work; preserved existing five-chapter contracts, artwork and numerical behavior |
| Low | Documentation review expectations were not captured as a durable engineering contract | Added [maintenance standards](documentation-standards.md), an expanded [PR checklist](../.github/pull_request_template.md), and CI-oriented editorial, ADR and OpenAPI guards with isolated fixtures |

## Document ownership after cleanup

- [README](../README.md): product, implemented scope and clear private/public distinction.
- [Documentation index](README.md): discoverability, provenance and source precedence, **not** a second status feed.
- [Release readiness](release-readiness-matrix.md): **single current checkpoint**, evidence boundaries and issues #12–#15.
- [Cloud Shell guide](cloud-shell-pause-resume.md): safe, conditional recovery/pause behavior; prior commands are archived.
- [Development](development.md): local dependencies, repository layout and source tests.
- [Architecture](architecture/system-design.md), [ADRs](architecture/decisions.md), [domain](architecture/domain-model.md) and [API contracts](api/README.md): implementation reference and accepted decisions.
- [Release QA](release-qa.md), [accessibility plan](accessibility-performance-qa.md), [acceptance worksheet](final-qa-acceptance-worksheet.md) and [AI evaluations](ai-local-evaluation.md): test methods, dated observations and explicit gaps.
- [Hosting feasibility](zero-mandatory-cost-hosting-assessment.md): options and blockers, **not** provider approval.
- Historical records: dated snapshots only; they must not override live runbooks.

## Verification and limitations

The documentation CI includes tests for local Markdown paths, one H1/closed code fences, obvious private-file names, non-destructive operator scripts, and now editorial duplicate/current-checkpoint rules, heading hierarchy, ADR completeness/order, and JSON/OpenAPI operation structure. The new editorial checker has isolated fixture tests. **The exact PR CI outcome must be verified from GitHub Actions before merging.**

The two OpenAPI JSON files parsed successfully and had distinct non-empty operation IDs, summaries and response definitions in the inspected operations. This **does not prove** a full schema-to-implementation conformance suite. External URLs, rendered Markdown diagrams, all browser configurations, screen-reader behavior, image layout, vulnerability absence, security and actual hosting costs require their own evidence.

**Canonical-source gap:** private Master v1.14 and Interactive Script v1.12 still describe the November 18 four-chapter milestone. Their original content was **not changed, copied or distributed** by this GitHub-only audit. A separate owner-reviewed reconciliation is required under [issue #14](https://github.com/AlexandroLeao/ami-108/issues/14).

**Release boundary:** issues [#12](https://github.com/AlexandroLeao/ami-108/issues/12), [#13](https://github.com/AlexandroLeao/ami-108/issues/13), [#14](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15](https://github.com/AlexandroLeao/ami-108/issues/15) remain open. This draft documentation review does **not** authorize public hosting, cost-bearing services, source distribution, gameplay changes or `v1.0.0`.

## Procedure for future documentation reviews

Follow the [documentation maintenance policy](documentation-standards.md): identify the owning document, review its **actual source and evidence**, update only the relevant scope, preserve accurately dated history, check for duplicated status and unsafe commands, execute CI and request explicit owner merge approval. Use the GitHub commit/PR history for earlier editorial audits rather than copying entire past audit reports into the current document.
