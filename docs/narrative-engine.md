# Narrative engine — AMI-004

**Scope:** first server-only domain increment, November 16, 2026. This is not a live campaign or a persisted session.

## Source and boundaries

- Current private source: Documento Mestre v1.10 and Roteiro Interativo v1.8, with the November 16 opening addendum taking precedence only for presentation. The original script is preserved. The asset preparation ZIP remains v1.9 until the owner requests an updated backup.
- `apps/api/src/narrative/catalog.ts` contains the five chapter titles and twelve narrative scene identifiers, plus the complete Chapter 1 dialogue sequence. The catalog is private server code; no complete source document or reference sheet is committed. CENA-01, 02 and 03 are the only scene images used in Chapter 1.
- Composite IDs preserve canonical scene/line identifiers, including L24–L25 removal, SILENCE and L01a/L01b as editorial subdivisions. L33 remains the authored free RANDOM fallback. The exact authored dialogue and tutorial are retained; three stage-direction narration strings (melody, E-JOIN, FB-D1) and three interaction labels are minimal bilingual presentation adaptations for owner review, not new plot events. Do not add explanations of Bobo, the planet, the injury, the past, or any other future reveal.
- Chapter 1 finishes at the Chapter 2 cartela boundary; no dog encounter or checkpoint is simulated.

## Implemented pure domain

- Versioned state starts at the Chapter 1 card. One forward action per step plus an authorized previous-dialogue action where available; composite action ID, monotonic revision; arbitrary targets and stale revisions are rejected. A separate review cursor is bounded within already-reached contiguous dialogue, never crossing scene, event, narration/flashback or interaction boundaries. Review does not rewind authoritative progress, repeat events, regenerate INTRO-RANDOM or debit energy.
- Localized projection contains only the current text, speaker, current scene, presentation cue, current asset reference, currently allowed action and diagnostics only after E-JOIN. It never includes the catalog, event list or internal INTRO cache. Asset identity is derived from the step, not a client parameter. This is an internal type, not a wired HTTP endpoint.
- E-JOIN initializes 3 energy and memory MED/BIO/HIST/PERSONAL 10/15/12/5 locked. The tutorial follows. INTRO-RANDOM creates exactly one fallback result in run state, consumes no energy, and is preserved on locale change. The provider adapter and durable cache are later work; fallback-only is not proof of real inference.
- MEM-D1 uses the authored pain line, then FB-D1 displays a textual memory over the dark field, then the street returns. No energy/memory mutation or inference.
- Opening cues: ellipsis, pain, wake, none; first three beats have no authorized image, L02 and L03 use the same CENA-01. No changes to the approved preview UI.
- Unit tests cover chapter/scene counts, uniqueness, SHA-256 of all 45 ordered authored dialogue beats independently extracted from the canonical source, read-only history, opening reveal, unauthorized/stale actions, E-JOIN, free INTRO fallback and locale stability, flashback, both language traversals and end boundary.

## Integration order

1. Wrap the pure engine in a durable session and transactional command service (AMI-006 prerequisite work); server-generated token digest, strict input validation, receipt and revision checks, same-origin cookie and Origin policy. Never accept a client state object. Add negative/duplicate/concurrency tests.
2. Expose only current authorized projection and asset through the API, not arbitrary image IDs. Integrate the Next.js same-origin facade and reuse the approved visual shell. Connect the existing bounded read-only history cursor to the approved previous/next controls, without reversing events or revealing future content.
3. Play Chapter 1 in both languages through the actual API; verify E-JOIN HUD, INTRO fallback, FB-D1, manual chapter progression, image consistency and reload. Obtain owner review of narration adaptations and visual acceptance before closing AMI-004.
4. Continue AMI-005/006: dog encounter, CP-DOG, choices, slots/energy, F1, SOL-01, E-NAME and persistence. Then real AI/RAG and remaining chapters per the production plan.

Current main still serves the AMI-003 development preview. Do not set production flags, expose a public catalog route, or close AMI-004 solely on the unit test suite. No paid services or new dependencies are required for this increment.
