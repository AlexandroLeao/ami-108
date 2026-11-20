# Narrative engine — AMI-004

## Day 4 Chapter 5 accepted — November 19

Merged PR #38 integrates the reviewed #30 catalog/domain into authoritative dispatch. Legacy Chapter 5 boundary resumes; chapter replay high-water reaches 5, and snapshots retain immutable boar slots. E-SHIP, CP-BOAR, E-LAUNCH and E-COMPLETE are transactional; the boar uses authored CORRECT only, no provider call. Original CENA-09/10 are gated by current scene; the owner revised Chapter 5 to confront the boar before retrieving the cell, with one shared departure dialogue regardless of recipe or consultation history. CP-BOAR precedes E-SHIP, then E-LAUNCH after gate opening. The black pre-reveal beats, gated CENA-09 startle, split orbit narration, centered final title and rolling credits supersede the original draft. Completion is a current-view optional boolean, ending and credits are distinct; no new postcredits scene. Owner approved desktop/mobile; exact CI passed and main merged at `7ae614d`. Final hangar route: damaged ships at entry, diagnostic terminal, separate maintenance storage behind boar, then intact ship in launch sector.


## Current implemented scope

All five chapters are playable and accepted. Chapter 3 retains its archive, MEM-D3, rat and F2; Chapter 4 uses `chapter-four-catalog.ts`, `chapter-four-domain.ts` and engine dispatch with the optional persisted marker, original cursor/revision/events, existing chapter snapshots and no new migration. F3 restores all indexes and energy atomically, manual and memory sequence lead to the Chapter 5 card; review does not replay events. Chapter 5 is integrated; #30 superseded by merged #38. Preserve current-only projection, stable IDs, replay high-water and immutable slots. Historical notes below are superseded where inconsistent.

> **Archived PR #38 snapshot:** [historical evidence](history-pr38-snapshot.md). For the latest verified seven-session pause and outstanding release gates, see [release readiness](release-readiness-matrix.md).

---


**Historical scope of PRs #19–#22:** Chapter 1 domain core and persisted campaign, extended through Chapter 2 by accepted PR #22 (`76946f9`, November 17, 2026). **Current state:** all five chapters are implemented and owner-approved; public production deployment remains unapproved.

## Source and boundaries

- **Current private source precedence:** Documento Mestre v1.14 and Roteiro Interativo v1.12, plus explicitly approved later owner amendments. Earlier v1.12/v1.10 and November 17 addenda are historical provenance, not the current authoritative revision. The original script is preserved. The asset preparation ZIP remains v1.9 until the owner requests an updated backup.
- `apps/api/src/narrative/catalog.ts` contains the five chapter titles and twelve narrative scene identifiers, plus the complete Chapter 1 dialogue sequence. The catalog is private server code; no complete source document or reference sheet is committed. CENA-01, 02 and 03 are the only scene images used in Chapter 1.
- Composite IDs preserve canonical scene/line identifiers, including L24–L25 removal, SILENCE and L01a/L01b as editorial subdivisions. L33 remains the authored free RANDOM fallback. The original dialogue is retained except for explicitly approved presentation edits; the unchanged tutorial is labelled as information. The owner-requested revisions add localized departure/arrival narration and street/robot reveals, subdivide long beats, revise the Bobo exchange and use AMI-108 as the revealed speaker. E-JOIN uses second-person narration on a dark field, followed by information and a narrated return to the street. FB-D1 uses seven short dark narration beats and a blink return. The original PR #20 catalog had 75 presentation beats; the accepted PR #22 catalog has 77; original stable IDs are retained. No new plot events. Do not add explanations of Bobo, the planet, the injury, the past, or any other future reveal.
- Merged PR #20 finished at the Chapter 2 cartela; merged PR #22 connects that stable handoff through the dog and terminal, ending at the Chapter 3 card. See [encounter engine](encounter-engine.md).

## Historical Chapter 1 pure domain (since extended through Chapter 5)

- Versioned state starts at the Chapter 1 card. One forward action per Chapter 1 step plus an authorized previous-dialogue action where available; the Chapter 2 handoff offers CONTINUE and PREVIOUS, composite action ID, monotonic revision; arbitrary targets and stale revisions are rejected. A separate review cursor is bounded within reached Chapter 1 presentation from L02 through the Chapter 2 handoff, including narration, information and already-applied events. Review never replays events; the initial card and dark beats cannot be reached by new PREVIOUS commands. Review does not rewind authoritative progress, repeat events, regenerate INTRO-RANDOM or debit energy.
- Localized projection contains only the current text, speaker, current scene, presentation cue, current asset reference, currently allowed action and diagnostics only at or after the visible E-JOIN beat (including historical review). It never includes the catalog, event list or internal INTRO cache. Asset identity is derived from the step, not a client parameter. The local session API returns this projection; the current asset URL includes a cache discriminator checked against the authorized step.
- E-JOIN initializes 3 energy and memory MED/BIO/HIST/PERSONAL 10/15/12/5 locked. The tutorial follows. INTRO-RANDOM creates exactly one fallback result in run state, consumes no energy, and is preserved on locale change. The Chapter 1 fallback is now persisted in the run state; resolved dog slots are now persisted in PR #22, while the provider adapter remains later work; fallback-only is not proof of real inference.
- MEM-D1 retains the authored pain line; FB-D1 closes the eyelids and displays seven dark narration beats, then the existing street art returns with blink/focus and a David ellipsis before L35. No energy/memory mutation or inference.
- Opening cues: ellipsis, pain, wake, none; first three beats have no authorized image, L02 and L03 use the same CENA-01. No changes to the approved preview UI.
- Unit tests cover chapter/scene counts, uniqueness, SHA-256 of the 45 original ordered authored dialogue beats after normalizing only the explicitly approved dialogue edits and subdivisions, read-only history, opening reveal, unauthorized/stale actions, E-JOIN, free INTRO fallback and locale stability, flashback, both language traversals and end boundary.

## Historical Chapter 1/2 persistence integration (now extended throughout campaign)

- Additive Prisma migration `20261116173000_chapter_one_sessions` adds a unique SHA-256 token digest, narrative version, JSON state, monotonic revision, expiry and command receipts. Existing foundation rows are preserved. The 30-day expiry is provisional for local validation; cleanup and production policy remain AMI-010.
- The server issues 32 random bytes encoded as a cookie capability; the same-origin facade forwards only that cookie, marks it HttpOnly/SameSite=Lax and Secure on HTTPS. New game is explicit; continuing restores the existing run. A confirmation protects replacement of the browser's current resume target; the prior row is not deleted. No account or client-supplied state.
- Mutations lock the session row in a PostgreSQL transaction, compare revisions and store unique command receipts atomically. Duplicate identical commands replay the current authorized view; conflicting IDs or stale revisions return 409. A distinct read-only history cursor persists without rewinding events. No provider calls inside transactions.
- Next.js allowlists the five game endpoints, checks mutation Origin, validates the asset key, proxies only the session cookie and uses private/no-store responses. Both API and facade require AMI_DEV_PREVIEW=1 for local integration. Production origin, rate limiting, retention and comprehensive security review remain pending.
- Local root reuses the approved wordmark, palette, typography, layout and cues. CENA-01 is a stable image source across L02/L03; only the authorized current asset is requested. Wake optics wait for image load, are removed at L03, and honor reduced motion. The energy-only indicator appears on illustrated beats after E-JOIN and on the three information cards; the first introduces it with a gentle pulse. The existing title/Menu header row remains fixed; memory values and lock remain in game state, not visibly rendered. Arrow captions and native arrow tooltips are omitted; server actions remain unchanged. Long dialogue is subdivided into authored beats; measured local pagination remains an accessibility fallback without visible page numbers, and advancing local pages does not mutate the server. The owner accepted the refined layout and header after local playtest; independent browser automation and full responsive/accessibility audit remain later work.
- `/preview` retains the isolated approved visual fixture. The merged Chapter 1 baseline ended at the Chapter 2 card. Merged PR #22 extends the campaign to the Chapter 3 card with a development notice; no fake later encounter or generated story.

## Historical PR #20/#22 integration order (implemented; not current next steps)

1. Implemented in PR #20: wrap the pure engine in a durable session and transactional command service (AMI-006 prerequisite work); server-generated token digest, strict input validation, receipt and revision checks, same-origin cookie and Origin policy. Never accept a client state object. Add negative/duplicate/concurrency tests.
2. Implemented in PR #20: expose only current authorized projection and asset through the API, not arbitrary image IDs. Integrate the Next.js same-origin facade and reuse the approved visual shell. Connect the existing bounded read-only history cursor to the approved previous/next controls, without reversing events or revealing future content.
3. Completed for the local integration: automated bilingual traversal, E-JOIN, INTRO fallback, FB-D1, manual progression, image authorization and reload/resume checks; owner accepted the revised presentation and merged PR #20. Issue #6 closed on November 17 after acceptance. Full browser E2E and accessibility verification remain AMI-010.
4. Completed Chapter 2 subset in PR #22: dog encounter, CP-DOG, choices, slots/energy, F1, SOL-01, E-NAME and persistence. Continue AMI-007 real AI/RAG and AMI-008 Chapter 3; AMI-006 remains partial for later persistence/restoration.

At the PR #22 milestone, main included the accepted playable local Chapters 1–2; the current approved runtime includes all five chapters. Final branch [CI 43934104792](https://github.com/AlexandroLeao/ami-108/actions/runs/43934104792) passed 42 tests (24 API, 17 web, 1 Python), lint, type checks, migrations, builds and built HTTP smoke; [post-merge CI 43935474618](https://github.com/AlexandroLeao/ami-108/actions/runs/43935474618) passed. Do not enable the local development flag in production or expose a public catalog route. No paid services or new dependencies are required. Private master/script revisions were synchronized on November 17; the asset ZIP v1.9 remains unchanged.

## November 17 owner presentation amendments (merged PR #22; chronological record)

77 Chapter 1 beats (two extra information beats), revised E-JOIN wording, three information cards and no other Chapter 1 dialogue edits. Existing IDs and narrative version retained so prior saves resume. Chapter 2 has three additional dark approach beats, one-shot startle cue and two warning narration beats. No back action at active decisions. See [encounter engine](encounter-engine.md) for persistent chapter replay and [UI design](ui-design.md) for approved-requested presentation changes. The historical refinement was subsequently accepted and synchronized into v1.12/v1.10.

### Second owner refinement — terminal arrival and memory

The solar information card is retired; AMI's existing explanation in A02-S02 remains unchanged. Old `A01-S03/TUTORIAL-d` authoritative cursors resume at RETURN-STREET and review cursors map to TUTORIAL-c, without replaying an event or altering revision. All three dog success branches now converge on three dark arrival narration beats before CENA-05 and L01. MEM-D2 starts with the new pain beat and a one-shot blink-to-black cue, followed by the existing dark pain line, unlabeled silence, familiar voice, AMI's dark call and L15 wake. L18 is split into three beats; E-NAME applies on the last, explicit recognition beat. Existing MEM-D2, FB-D2, E-NAME and F1/SOL-01 event IDs and effects remain unchanged. See [encounter engine](encounter-engine.md).

### Third owner refinement

ARRIVAL-03 describes observing AMI connect to the panel and emit brief electronic sounds while searching for a component. FOUND introduces “Componente localizado.” / “Component located.” and the terminal fade-in before the unchanged L01. The cake-related L04 variant becomes “Então vai parar de falar coisas aleatórias?”; the existing no-recipe bananas variant remains unchanged. FB-D2 familiar voice is now two dark beats F01 and F01b (“Sinto muito...” / “David...”); the dark MEM-D2 line uses the existing pain cue. Stable prior IDs and event effects retained. No change to SOL-01 or other transitions.

### Fourth owner refinement

ARRIVAL-03 now describes AMI examining the system, FOUND says “Encontrado.” / “Found.” and L01 identifies a compatible storage unit. FB-D1b–g, MEM-D2 and F01/F01b carry the continuous memory-shiver cue; L18c carries name-reveal without altering E-NAME or speaker state. No additional motion on unrelated beats. All IDs, action effects and existing saves retained.

### Owner correction

A02-S02/L04 uses “Então vai parar de falar coisas aleatórias?” / “So you'll stop saying random things?” for all three successful dog branches, without a recipe-dependent bananas override. Preserve the prior branch dialogue, recipe exposure data, event IDs and effects. The name reveal is presentation-only, now 1800ms. No other narrative changes.

### Targeted owner refinement

TUTORIAL adds presentation-only energy-reveal. Insert bilingual L08b immediately before L09: “Quanto à minha energia, existe uma forma de recuperá-la.” / “As for my energy, there is a way to restore it.” SOL-01 remains applied exactly once on entering L09; its existing interaction moves from L08 to the new L08b. Existing L08 saves advance normally, existing later saves retain their already applied event. Dog L01/L02 retain CENA-04; startle remains L01-only. L18c name reveal changes presentation only.

### Latest owner refinement

ARRIVAL-03: “Você observa AMI se conectar ao sistema enquanto emite breves sons eletrônicos.” / “You watch AMI connect to the system while emitting brief electronic sounds.” FOUND is dark, cue none; L01 alone authorizes CENA-05 and fade-in. All three branches and existing step IDs retain their transitions. Dog L01 reveal delays the image relative to its text; L18c alternation is faster. No other dialogue or state changes.

## Day 2 accepted baseline

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.

For final wording, cues, geometry and replay rules, the [final accepted encounter baseline](encounter-engine.md#final-accepted-baseline-supersedes-earlier-refinement-details) and [UI design](ui-design.md) supersede historical refinement notes above. No other content or future reveals may be changed without owner authorization.
