# Narrative engine — AMI-004

**Scope:** Chapter 1 domain core (PR #19, merged) and local persisted campaign integration (PR #20, pending owner acceptance), November 16, 2026. Not the full campaign or a production deployment.

## Source and boundaries

- Current private source: Documento Mestre v1.10 and Roteiro Interativo v1.8, with the November 16 opening addendum taking precedence only for presentation. The original script is preserved. The asset preparation ZIP remains v1.9 until the owner requests an updated backup.
- `apps/api/src/narrative/catalog.ts` contains the five chapter titles and twelve narrative scene identifiers, plus the complete Chapter 1 dialogue sequence. The catalog is private server code; no complete source document or reference sheet is committed. CENA-01, 02 and 03 are the only scene images used in Chapter 1.
- Composite IDs preserve canonical scene/line identifiers, including L24–L25 removal, SILENCE and L01a/L01b as editorial subdivisions. L33 remains the authored free RANDOM fallback. The exact authored dialogue and tutorial are retained; the owner-requested playtest revision adds localized departure/arrival narration and street/robot reveals, subdivides long beats, revises L02–L03 and uses AMI-108 as the revealed speaker. E-JOIN and FB-D1 narration remain as before. No new plot events. Do not add explanations of Bobo, the planet, the injury, the past, or any other future reveal.
- Chapter 1 finishes at the Chapter 2 cartela boundary; no dog encounter or checkpoint is simulated.

## Implemented pure domain

- Versioned state starts at the Chapter 1 card. One forward action per step plus an authorized previous-dialogue action where available; composite action ID, monotonic revision; arbitrary targets and stale revisions are rejected. A separate review cursor is bounded within reached Chapter 1 presentation from L02 through the Chapter 2 handoff, including narration, information and already-applied events. Review never replays events; the initial card and dark beats cannot be reached by new PREVIOUS commands. Review does not rewind authoritative progress, repeat events, regenerate INTRO-RANDOM or debit energy.
- Localized projection contains only the current text, speaker, current scene, presentation cue, current asset reference, currently allowed action and diagnostics only after E-JOIN. It never includes the catalog, event list or internal INTRO cache. Asset identity is derived from the step, not a client parameter. The local session API returns this projection; the current asset URL includes a cache discriminator checked against the authorized step.
- E-JOIN initializes 3 energy and memory MED/BIO/HIST/PERSONAL 10/15/12/5 locked. The tutorial follows. INTRO-RANDOM creates exactly one fallback result in run state, consumes no energy, and is preserved on locale change. The Chapter 1 fallback is now persisted in the run state; provider adapter and encounter-slot cache are later work; fallback-only is not proof of real inference.
- MEM-D1 retains the authored pain line; FB-D1 closes the eyelids and displays seven dark narration beats, then the existing street art returns with blink/focus and a David ellipsis before L35. No energy/memory mutation or inference.
- Opening cues: ellipsis, pain, wake, none; first three beats have no authorized image, L02 and L03 use the same CENA-01. No changes to the approved preview UI.
- Unit tests cover chapter/scene counts, uniqueness, SHA-256 of all 45 ordered authored dialogue beats independently extracted from the canonical source, read-only history, opening reveal, unauthorized/stale actions, E-JOIN, free INTRO fallback and locale stability, flashback, both language traversals and end boundary.

## Integrated local session and transport

- Additive Prisma migration `20261116173000_chapter_one_sessions` adds a unique SHA-256 token digest, narrative version, JSON state, monotonic revision, expiry and command receipts. Existing foundation rows are preserved. The 30-day expiry is provisional for local validation; cleanup and production policy remain AMI-010.
- The server issues 32 random bytes encoded as a cookie capability; the same-origin facade forwards only that cookie, marks it HttpOnly/SameSite=Lax and Secure on HTTPS. New game is explicit; continuing restores the existing run. A confirmation protects replacement of the browser's current resume target; the prior row is not deleted. No account or client-supplied state.
- Mutations lock the session row in a PostgreSQL transaction, compare revisions and store unique command receipts atomically. Duplicate identical commands replay the current authorized view; conflicting IDs or stale revisions return 409. A distinct read-only history cursor persists without rewinding events. No provider calls inside transactions.
- Next.js allowlists the five game endpoints, checks mutation Origin, validates the asset key, proxies only the session cookie and uses private/no-store responses. Both API and facade require AMI_DEV_PREVIEW=1 for local integration. Production origin, rate limiting, retention and comprehensive security review remain pending.
- Local root reuses the approved wordmark, palette, typography, layout and cues. CENA-01 is a stable image source across L02/L03; only the authorized current asset is requested. Wake optics wait for image load, are removed at L03, and honor reduced motion. Diagnostics appear only after E-JOIN. Long dialogue is subdivided into authored beats; measured local pagination remains an accessibility fallback without visible page numbers, and advancing local pages does not mutate the server. Page layout and new HUD require owner visual acceptance.
- `/preview` retains the isolated approved visual fixture. The campaign ends at the Chapter 2 card boundary with a development notice; no fake encounter or generated story.

## Integration order

1. Implemented in PR #20: wrap the pure engine in a durable session and transactional command service (AMI-006 prerequisite work); server-generated token digest, strict input validation, receipt and revision checks, same-origin cookie and Origin policy. Never accept a client state object. Add negative/duplicate/concurrency tests.
2. Implemented in PR #20: expose only current authorized projection and asset through the API, not arbitrary image IDs. Integrate the Next.js same-origin facade and reuse the approved visual shell. Connect the existing bounded read-only history cursor to the approved previous/next controls, without reversing events or revealing future content.
3. Play Chapter 1 in both languages through the actual API; verify E-JOIN HUD, INTRO fallback, FB-D1, manual chapter progression, image consistency and reload. Obtain owner review of narration adaptations and visual acceptance before closing AMI-004.
4. Continue AMI-005/006: dog encounter, CP-DOG, choices, slots/energy, F1, SOL-01, E-NAME and persistence. Then real AI/RAG and remaining chapters per the production plan.

The previous main served only the AMI-003 preview. PR #20 adds a playable local Chapter 1 candidate. Do not set production flags, expose a public catalog route, or close AMI-004 before the integrated owner playtest. No paid services or new dependencies are required for this increment.
