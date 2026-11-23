# Game and AI API contracts

The [Game OpenAPI 3.1 contract](game.openapi.json) describes the implemented same-origin `/api/game` facade and its NestJS-backed game operations. The [internal AI contract](ai.openapi.json) describes authenticated FastAPI generation requests and validated response selection. These specifications are maintained by hand and checked structurally in CI; they are not a guarantee of full runtime/schema conformance.

## Game API

| Method and path | Responsibility |
| --- | --- |
| `POST /session` | Start a new game, issue an opaque session cookie and return the initial authorized projection |
| `GET /view` | Resume or read the current localized projection |
| `POST /commands` | Apply a currently permitted narrative action, including consultation, retry and chapter replay |
| `PATCH /locale` | Change displayed language without rerolling outcomes or replaying inference |
| `GET /asset` | Return only the scene image authorized by the current session and matching cache discriminator |

The Next.js facade is same-origin and rejects unsupported endpoints and methods. The NestJS API owns the authoritative game state, transition rules and database transactions. Client payloads cannot select hidden scenes, correct encounter outcomes or arbitrary AI input.

## Authentication, state and error handling

- Session identity is an opaque server-generated capability carried in an `HttpOnly`, `SameSite=Lax` cookie, with `Secure` added for HTTPS. Only its digest is stored in PostgreSQL.
- Mutations (except new-session creation) carry a UUID `commandId` and `expectedRevision`. Identical retries are idempotent and return the recorded result or authorized current view. Conflicting or stale requests receive HTTP 409.
- Pending consultations are reserved and finalized without holding a database lock during network inference. Authorized fallback preserves the encounter category, energy semantics and saved consultation response.
- Public session creation has an atomic **50-new-session-per-UTC-day** admission budget. On exhaustion, `POST /session` returns **HTTP 429 `CAPACITY_LIMIT`**. The separate daily model-attempt limit falls back to approved text rather than returning HTTP 429 for the consultation.
- Other documented errors include HTTP 400 (invalid input), 401 (missing/invalid session), 403 (disallowed action or origin), 404 (disabled route or unauthorized asset), 409 (conflict), 413 (oversized body), 415 (unsupported media type) and 503 (service unavailable). Some facade rejections return empty bodies.
- The facade enforces a 2048-byte mutation body limit and a 10-second upstream deadline. The AI service uses a private authenticated request, allowlisted facts and validated provider selection. No provider key or hidden narrative facts are sent to the browser.

See [system design](../architecture/system-design.md), [security controls](../architecture/production-security-gates.md) and [release readiness](../release-readiness-matrix.md) for architecture, implemented limits and acceptance boundaries.

## Validation boundaries

Existing tests cover five-chapter gameplay, session persistence, idempotency, security-sensitive rejection paths, bounded AI selection and migration logic. OpenAPI smoke checks structure and selected response shapes, not every possible HTTP response or hosted provider failure. Dated CI results and live Production observations belong to [release QA](../release-qa.md) and [release readiness](../release-readiness-matrix.md). Historical Chapter 1–3 contracts and PR milestones are preserved in [development history](../development-history.md).
