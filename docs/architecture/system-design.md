# System design

## Current implemented containers and boundary

NestJS controls all five chapters, DOG/RAT/BOAR, all three checkpoints, immutable slots, F1/F2/F3, replay and completion with current-only artwork. PR #24 implements optional authenticated internal inference and durable reservation/finalization; previously verified real local provider, default disabled. PRs #35/#36 expand the authorized RANDOM pool; #29 closed. BOAR authored only. Current recovered VM runs fallback; no external provider or paid resource enabled. Release QA and production deployment remain pending.

**Historical PR #38 status snapshot (superseded; current state: [release-readiness matrix](../release-readiness-matrix.md)):** All five chapters owner-approved (5/5, 100% of campaign, not release completion). Formal AMI issues 9/13 (69.2%) closed, plus #29; #8 and #11 completed. PR #38 merged `7ae614d` with exact approved head `817aa5d` (identical tree); [CI 44550503677](https://github.com/AlexandroLeao/ami-108/actions/runs/44550503677) passed 201 tests (100 API, 30 web, 71 Python), four migrations, lint/types/build and full HTTP smoke with 12 original artwork hashes. Owner desktop/mobile preview reached credits, PERSONAL unlocked, no consultation rows in final preview; main four services healthy and two sessions preserved. Story frozen. F1/F2/F3 atomically restore energy and memory; CP-DOG/RAT/BOAR and immutable slots persisted; CP-BOAR precedes E-SHIP and E-LAUNCH. BOAR always authored CORRECT, no model call. Expanded AI #35/#36 unchanged (24 bilingual RANDOM options, at most three sampled, 15/42/100 probabilities, 2s/2.5s deadlines); prior real benchmark 81/82, 21/24 distinct and live 10/10. Day 4 replacement VM restored verified archive `day3-final-ai-20261119-004433.dump` into empty DB at `fd0a906`, Continue confirmed; generation disabled temporarily. Owner subsequently confirmed the merged campaign installed at port 3000 and existing saves open normally; runtime `7ae614d` per installation procedure, final terminal audit pending. Documentation PR #39 merged `9c79913` after CI 44554390370 passed. Day 4 pause requested; final private backup and stopped-container evidence pending owner execution. On resume verify backup, VM and saves before re-enabling pinned Qwen2.5:1.5b (65ec06548149) on internal Ollama network. Private Master v1.14 / Script v1.12 plus later owner-approved amendments authoritative; source synchronization pending. #30 superseded and closed. Remaining #12 QA/security/accessibility, #13 zero-cost deployment, #14 final documentation and #15 release. No new migrations, art or paid resources. Historical notes below do not supersede this baseline.

---


**AMI-002 · reviewed design, merged in PR #17; implementation is incremental**  
Canonical narrative: Documento Mestre v1.12 / Roteiro Interativo v1.10 (private backup). See [requirements](requirements.md), [domain model](domain-model.md), [decisions](decisions.md) and [API contracts](../api/README.md).

## C4 level 1 — system context

```mermaid
flowchart LR
  Player["Person: player"] -->|Browser HTTPS| Game["System: AMI-108"]
  Owner["Person: project owner"] -->|Review and validate| Game
  Game -->|Optional bounded inference| Provider["External model provider / local Ollama"]
```

## C4 level 2 — containers

```mermaid
flowchart LR
  Browser["Player browser"] -->|"Same-origin HTTP(S)"| Web["Next.js / React / TypeScript"]
  Web -->|"Internal REST; session credential"| API["NestJS / TypeScript"]
  API -->|"Prisma, transactions"| DB[("PostgreSQL")]
  API -->|"Internal validated request"| AI["FastAPI / Python / Pydantic"]
  AI -->|"Provider adapter; allowed facts only"| Model["Ollama or approved free API"]
  API -->|"Authorized image bytes"| Art["Private scene asset storage"]
  GH["GitHub Actions"] -.-> Web
  GH -.-> API
  GH -.-> AI
```

Browser requests go through the web origin; Next route handlers proxy the game API without exposing the internal service URL or secrets. NestJS validates session ownership and current state for every read and mutation. PostgreSQL is the sole durable authority. FastAPI is internal, stateless with respect to game state, and never chooses outcomes. Local storage for derived image files is sufficient for the MVP; S3 is conditional, not a current dependency. Public URLs and bundled assets are not access control. Stream authorized image bytes through the game API; no future scene assets under public web directories.

## C4 level 3 — NestJS components

```mermaid
flowchart TD
  H["Session / game / asset controllers"] --> Auth["Session authorization and rate limit"]
  Auth --> Commands["Command service"]
  Auth --> Queries["Projection service"]
  Commands --> Engine["Pure narrative transition engine"]
  Commands --> Consult["Consultation orchestration"]
  Engine --> Catalog["Server-only versioned narrative catalog"]
  Queries --> Catalog
  Commands --> Repo["Prisma repositories / transaction boundary"]
  Consult --> Repo
  Consult --> AIClient["Internal AI client"]
  AIClient -->|HTTP timeout + validated contract| FastAPI["FastAPI"]
  Queries --> Repo
  Queries --> Assets["Asset authorization"]
```

AMI-004 began with pure deterministic domain functions in apps/api/src/narrative (PR #19). The tested core is now wrapped by the persisted session/receipt service, authorized NestJS endpoints and Next.js same-origin facade in merged PR #20. Merged PR #22 added dog and CP-DOG/slot tables; PR #25 adds RAT, CP-RAT, F1/F2 restoration-linked recharge and Chapter 4 entry replay. Later boar/F3 and real inference remain planned. Inject RNG and provider/client dependencies for tests. Keep scene data, exact outcomes, reveal policies and fallback text in server-only modules. UI only renders a projection of the current screen, not arbitrary scene selection. The existing health endpoints remain diagnostics.

## Deployment and environments

- Observed baseline: local Compose, four healthy services, Node 22 and Python 3.12, CI success, Google Cloud Shell approved visual preview (PR #18) and owner-accepted local Chapter 1 with persisted sessions (PR #20, `3cf942a`; post-merge CI passed); Codespaces config exists but is untested.
- Production candidate: same-origin web facade, private API/AI/database connections, HTTPS, secrets injected via environment, bounded request/logging policies; no resources provisioned.
- AWS and external provider use require explicit cost, eligibility, data policy and owner verification. CI/CD and OpenTofu are incremental deliverables.
- Temporary Cloud Shell volumes are not durable backups. Source code lives in GitHub; official narrative and art backups in Drive.

## UML sequence — consultation with reservation

```mermaid
sequenceDiagram
  participant W as Web
  participant N as NestJS
  participant D as PostgreSQL
  participant F as FastAPI
  participant L as Model
  W->>N: Consult(commandId, expectedRevision)
  N->>D: Transaction: verify session/state, reserve slot and debit once
  alt duplicate command
    D-->>N: Existing receipt
    N-->>W: Same command result / pending status
  else existing slot cache
    D-->>N: Category and cached result
    N-->>W: Localized current projection
  else new slot
    D-->>N: Committed reservation + selected category
    N->>F: Authorized question, category, fact IDs, locale
    F->>L: Bounded inference on allowed context
    L-->>F: Candidate text
    F-->>N: Validated result or fallback signal
    N->>D: Transaction: finalize reserved slot and command receipt
    N-->>W: Updated projection
  end
```

Do not hold database locks during network inference. A pending slot has an explicit deadline and deterministic fallback recovery; retries reuse the reservation, not a new draw or debit. On timeout after an uncertain provider call, finalize with fallback rather than issue another inference. While pending, block conflicting mutations; retry the same command ID or read current status. No in-flight generation can mutate a later scene or attempt. Locale changes preserve the existing fact/category; missing translation uses authored fallback, not a new provider call.

## UML state — game screen lifecycle

```mermaid
stateDiagram-v2
  [*] --> Menu
  Menu --> ChapterCard: new or resume
  ChapterCard --> Narrative: continue
  Narrative --> Flashback: mandatory trigger
  Flashback --> Narrative: return to present
  Narrative --> Encounter: enter authorized checkpoint
  Encounter --> Encounter: consult or read
  Encounter --> Dead: lethal choice
  Dead --> Encounter: explicit return / snapshot
  Encounter --> Narrative: safe choice
  Narrative --> ChapterCard: next chapter
  Narrative --> Credits: E-COMPLETE
  Credits --> Menu
```

This is a conceptual state machine, not an implementation. The concrete allowed events are in the canonical scene map and [domain model](domain-model.md). No skip endpoint, arbitrary scene jump, new branch of the campaign, or retry on a successful encounter.

## Security and operational boundaries

- Anonymous session capability: cryptographically random opaque token in secure HttpOnly SameSite cookie at the web boundary; store only a token digest. No account/password system required for MVP (proposal). Validate Origin on mutations, reject cross-origin requests, never trust client progress. Bind capability to one session.
- Only current allowed actions and current asset are visible. Generic unauthorized asset responses do not reveal whether future content exists. Set private/no-store cache policy for session projections and gated image responses.
- Never send the full script, personal data or future context to an external model. Service credentials remain server-side. Use a strict allowlist of fact IDs with question/category and narrative phase, validated output and fallback.
- Rate limit by session and conservative IP policy; cap session creation, body size and provider calls. No user-entered prompt field.
- Use correlation IDs, status/error codes and timing metrics without logging session tokens, prompt bodies or protected content.
- Liveness checks only process health; game readiness must not require an online LLM. AMI-001 readiness checks AI connectivity as a diagnostic; adjust degraded-mode policy during implementation.

Day 2 observed baseline: PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes). No production resources or real model provider have been provisioned. Continue with the pending provider reservation/finalization design and later encounters.
