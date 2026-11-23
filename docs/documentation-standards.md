# Documentation standards and review policy

**Authority:** engineering review policy for version-controlled documentation. Changes are adopted only through an owner-approved, CI-verified pull request.  
**Applies to:** tracked Markdown, technical OpenAPI references, architecture diagrams, runbooks, the root README, the engineering instructions, and their GitHub pull requests. The private Master/Interactive Script and original artwork are governed separately by owner approval; do not export them into this repository.

## Purpose and audience

AMI-108 documentation must let another engineer understand **what is implemented, how to inspect or operate it safely, why decisions were made, what was actually tested, and what remains unapproved** without having to reconstruct chat history.

Use **English** for repository engineering documentation, including PRs, ADRs, issues, code comments and technical change logs. Preserve the approved **PT-BR/EN** game content verbatim. The owner's private canonical narrative documents remain in Portuguese unless explicitly revised. Write for maintainers, reviewers and prospective technical collaborators; avoid personal career anecdotes, filler, exaggerated completion claims and unverifiable superlatives.

## Information architecture and ownership

Use the [Diátaxis](https://diataxis.fr/) distinction pragmatically; do **not** introduce empty categories or duplicate a fact in every category.

| Document type | Reader question | Primary owner |
| --- | --- | --- |
| Overview | What is the product, stack and supported scope? | [Root README](../README.md) |
| Navigation | Where is the authoritative reference? | [Documentation index](README.md) |
| Current release state | What is verified **now**, what is blocked, and what is the next decision? | [Release readiness](release-readiness-matrix.md) |
| How-to / operations | What preconditions, safe steps, stop conditions and rollback boundaries apply? | [Development](development.md) and [Cloud Shell runbook](cloud-shell-pause-resume.md) |
| Technical reference | What are the contracts, state invariants, services and assets? | [Architecture](architecture/system-design.md), [domain](architecture/domain-model.md), [API contracts](api/README.md) and implementation-specific references |
| Explanation / decisions | Why this architecture and what are the trade-offs? | [ADRs](architecture/decisions.md) |
| Verification | What was observed, when, by whom/method, and what was **not** tested? | [Release QA](release-qa.md) and [acceptance worksheet](final-qa-acceptance-worksheet.md) |
| Archived evidence | What happened at an older milestone? | Clearly marked `*-history.md`, dated evaluation records and [audit log](documentation-audit.md) |

Keep the **latest environment/backup checkpoint only in release readiness**. Other active documents link there and describe only their own responsibilities. Do not copy long status narratives between README, operations, QA and architecture documents. Retain old evidence in clearly labeled archives; never silently rewrite historical measurements to look current.

## Editorial conventions

- Use **one descriptive H1**, a logical H2/H3 hierarchy, short paragraphs and meaningful headings in sentence case.
- Use fenced code blocks with a language identifier (`bash`, `json`, `mermaid`, etc.). Prefer verified, copy-safe examples; add the environment and prerequisites next to commands.
- Use descriptive relative Markdown links for repository files, explicit descriptive titles for external references, and link to the primary owner rather than copy its content.
- Use consistent terms: **Web** (Next.js), **API** (NestJS), **AI service** (FastAPI), **Ollama** (optional local model), **saved sessions**, **pending generations**, **Prisma migrations**, **private preview** and **public deployment**.
- Distinguish **implemented**, **CI-tested**, **owner-observed**, **historically measured**, **proposed**, **blocked** and **authorized**. Never equate a health response, CI pass or manual sample with production readiness, WCAG compliance or sustained performance.
- For quantitative claims, include the measurement date and context. If a figure is superseded, identify it as historical. Avoid percentages that mix campaign completion with release completion.
- Preserve author-approved narrative IDs, artwork names, localized dialogue and source precedence. Do not “polish” game text from technical documentation.
- Keep statuses consistent with the actual issues and PRs. An open PR is **proposed**, not merged; a draft canonical addendum is **not** a revised source.

## Operational/runbook contract

Every live runbook must provide: **scope**, **preconditions**, **read-only inspection**, **actions**, **verification**, **failure/stop behavior**, **data protection**, and **what not to execute**. Commands written for a prior VM, a different AI generation flag or an already completed restoration belong in an archive, **not** in a current copyable procedure.

Never recommend `pg_restore` into a populated database, `docker compose down -v`, Docker pruning, deleting backups, exposing secrets, replacing `.env`, forced git fast-forward or downloading the model without confirming resource and identity guards. The reviewed local game revision and the documentation branch may legitimately differ.

## Architecture and API evidence

Each ADR must have a stable numeric identifier, **status, context, decision, considered alternatives and consequences**. New material decisions remain **proposed** until owner acceptance; implementation status and acceptance date should be explicit. Superseded decisions are preserved with cross-references.

OpenAPI documents are **hand-maintained** implementation references. Describe the scope of contract smoke tests accurately; do not assert that CI proves full schema conformance. C4, Mermaid and ER diagrams distinguish implemented services from candidate deployment architecture.

## Security, privacy and release boundaries

- Do not include `.env`, credentials, tokens, cookies, database dumps, raw private session payloads, unpublished reference sheets or canonical private PDFs/Markdown in Git.
- Anonymize logs and explain what their sample proves; never paste private source excerpts into issue comments or public hosting descriptions.
- Separate **nonprofit intent**, **zero mandatory service-cost target**, **provider free-tier limits** and **permission to deploy**. These are distinct claims.
- The game's **16+** notice is editorial until classification and legal applicability are validated; do not call it an official rating.
- The game and source repository are already public for portfolio demonstration. Do not change visibility, expose private materials, create release tags, modify deployed resources, enable paid services or grant redistribution rights without explicit owner approval. Public source visibility alone is not an open-source license.

## Required evidence and review gates

For each documentation PR:

1. Identify **why** the document changed, its owning audience, affected references, preserved history, and what remains unknown.
2. Verify relative links, single H1, closed code fences, headings, code examples, technical assertions and contradictions with [release readiness](release-readiness-matrix.md).
3. Compare against the accepted game source and tests where a claim is implementation-specific. Note if browser tests, model inference, production or private source parity **were not** run.
4. Run documentation checks and existing CI; perform a **human semantic read** of modified prose. Automated formatting passes do not certify accuracy or readability.
5. Require owner's explicit approval before merge; verify the merged diff and keep the local frozen game revision unchanged unless separately authorized.

## Useful standards and references

- [Diátaxis documentation framework](https://diataxis.fr/)
- [Google documentation best practices](https://google.github.io/styleguide/docguide/best_practices.html) and [Markdown style](https://google.github.io/styleguide/docguide/style.html)
- [Google developer documentation accessibility guidance](https://developers.google.com/style/accessibility)
- [Microsoft guidance on architecture decision records](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record)
