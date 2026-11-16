# Proposed API contracts

The two OpenAPI 3.1 JSON documents are design contracts, not generated runtime specifications. Only /health and /health/ready are implemented in the bootstrap. Implement and verify against these contracts incrementally in AMI-004–007; adjust with reviewed ADRs when necessary.

- [Game API](game.openapi.json): session creation/resume, current projection, commands and protected asset.
- [AI internal API](ai.openapi.json): authorized generation request and candidate result/fallback signal. Never expose to the browser.

## Conventions

- Same-origin facade on Next.js; internal NestJS API routes use the same shapes. Use server-generated opaque session capability; no session secret in JSON or URL. Session cookie is a proposal in ADR-004.
- Every mutation has a UUID commandId and expectedRevision (except session creation). Check duplicate receipts before stale revision; identical retry returns its recorded outcome/current authorized view, conflicting payload returns 409. While generation is pending, poll the current view or retry the identical command; conflicting actions return 409.
- Commands are allowed only if listed by the current projection; client sends an action ID, not a target scene, outcome, energy, fact or category. Server projects localized current text, image URL, available actions and AMI diagnostics only after E-JOIN.
- HTTP 400 invalid input; 401 missing/invalid session; 403 disallowed action; 409 stale revision/conflict; 429 rate limit; 503 unavailable. Do not include stack traces or future facts. Return localized user-facing messages from client error mapping.
- AI request is server-to-server; validate question/category/fact combination against the server-side allowlist and reject unsupported content. Provider only receives allowed context; output must be checked against authored facts and fallback. A failed/untrusted candidate never determines gameplay.
- Asset authorization uses the session and current step; image response is private/no-store. Never send a full catalog or solution key in any response.
- Timeouts, rate limit values, session expiry and exact final field names will be verified during implementation. No live API claims are made by this document.
