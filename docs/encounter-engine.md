# Encounter engine — AMI-005 / AMI-006

November 17, 2026 · Day 2. The pure encounter module is the first incremental implementation, not a playable Chapter 2 yet.

## Implemented domain groundwork

- Server-only DOG definition transcribed from the approved Master v1.11 / Script v1.9: fixed order, four choices, authored bilingual consequences, 15% CORRECT threshold, recipe fallback. No player-facing correctness marker.
- Injected RNG, one debit per consultation, three slots maximum, zero energy permits choice. Cached slot reused after retry without reroll, but costs one restored bar. No provider call. Successful-attempt categories select A/B/C; recipe exposure tracked for later L04 continuity.
- Death retains energy until explicit retry; retry restores checkpoint energy and clears attempt-local categories/recipe flag without erasing cached slots. Pure rules do not themselves implement database snapshots or receipts.
- Unit tests assert outcomes, threshold, no negative energy, cached replay, retry, variants and invalid actions.

## Integration sequence

1. Add Chapter 2 authored localized beats, current-asset authorization and a backward-compatible saved-state extension. Keep Chapter 1 stable IDs and prior saves; the existing chapter handoff must resume correctly.
2. Persist CP-DOG snapshot and unique consultation slots transactionally with command receipts; restore snapshot only on explicit retry. Do not expose stored categories or choice outcomes before authorization.
3. Connect dialogue, consultation question/answer/reaction, four fixed choices, death consequence and checkpoint return, successful branch A/B/C. Retain approved frame/header and keyboard/pointer access.
4. Add A02-S02 F1 (35/42/53/5 locked), SOL-01 (3 bars independently of F1), continuity-dependent L04, MEM-D2/FB-D2 and E-NAME. Stop at Chapter 3 boundary until implemented.
5. Verify concurrent duplicate consultation/choice, stale revision, restart, authorization, all four choices, zero energy, retries, both languages and full owner playtest. Real provider reservation/finalization remains AMI-007.

No new artwork, story, inventory, paid service or production deployment.
