# System design

**AMI-002 · proposed implementation design for review**  
Canonical narrative: Documento Mestre v1.9 / Roteiro Interativo v1.7 (private backup). See [requirements](requirements.md), [domain model](domain-model.md), [decisions](decisions.md) and [API contracts](../api/README.md).

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

Implement pure deterministic domain functions before framework adapters. Inject RNG and provider/client dependencies for tests. Keep scene data, exact outcomes, reveal policies and fallback text in server-only modules. UI only renders a projection of the current screen, not arbitrary scene selection. The existing health endpoints remain diagnostics.

## Deployment and environments

- Observed baseline: local Compose, four healthy services, Node 22 and Python 3.12, CI success, Google Cloud Shell preview; Codespaces config exists but is untested.
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
