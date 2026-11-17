# Encounter engine — AMI-005 / AMI-006

November 17, 2026 · Day 2. Draft PR #22 connects the local campaign through Chapter 2. Owner playtest and CI are required before acceptance.

## Implemented candidate

- Server-only DOG definition and bilingual Chapter 2 beats transcribed from Master v1.11 / Script v1.9. Existing Chapter 1 IDs/version and handoff retained; old Chapter 1 saves do not require reset.
- Four ordered choices, authored consequences, 15% CORRECT threshold, free INTRO separate from three encounter slots. Fallback only; no real inference yet.
- Injected RNG, one debit per consultation, three slots maximum, zero energy permits choice. Cached slot reused after explicit retry without reroll but costs one restored bar. Q-DOG, AMI answer, R-DOG after RANDOM and A/B/C variants use current successful attempt only; L04 cake/bananas continuity.
- CP-DOG captures the initial step, diagnostics and event flags once. Death consequence and death card precede explicit retry. Restore checkpoint while keeping attempt/revision, locale, INTRO and resolved slots outside rollback. Read-only history within the current attempt, without issuing historical choices/consultations or replaying events; history before the checkpoint is not traversable from inside the encounter.
- Additive Prisma migration records immutable checkpoint and unique resolved slot rows in the same locked transaction as JSON progress and command receipt. The current JSON includes the checkpoint and slot cache for pure transition functions; normalized rows are durable transactional records. No provider reservation yet.
- F1 is applied once on terminal interaction (35/42/53/5 locked, no recharge); SOL-01 restores 3 bars independently. MEM-D2/FB-D2 and E-NAME are authorized authored beats. Ends at Chapter 3 card; no simulated Chapter 3.
- CENA-04/05 served only at the authorized current view. Decision and retry buttons appear in the dialogue frame, not over the art. Consultation occupies its own row; portrait decision frame grows without cropping the image, with internal scrolling as a short-viewport fallback. No automatic selection on right-arrow; explicit button activation only.
- Domain tests, PostgreSQL HTTP tests and built HTTP smoke extended. Full browser visual, mobile/zoom and accessibility checks remain owner playtest/AMI-010.

## Remaining boundaries

Real provider reservation/finalization, bounded retries and RAG remain AMI-007. Later rat/boar checkpoints, F2/F3, SOL-02, later memories and complete campaign are not implemented. No new artwork, inventory, paid service or production deployment.
