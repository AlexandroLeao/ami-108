# Encounter engine — AMI-005 / AMI-006

## Current encounter rules

DOG and RAT each retain four deterministic choices, three lethal and one safe, checkpoint retry, immutable slots and one energy debit per consult. CORRECT probabilities 15%/42%/100% (BOAR catalog only); zero energy allows choices. F1 (35/42/53/5 locked), F2 (75/85/78/5 locked), F3 (100/100/100/100 unlocked) restore three bars atomically. No solar actions. Dog/rat use the approved gradual reveal and existing shake; Chapter 4 HUD is hidden without changing energy. CP-DOG/CP-RAT and opt-in provider reservation/finalization are implemented. CP-BOAR, E-SHIP and launch remain pending; #29 tracks RANDOM diversity and live activation.

**Current accepted baseline — November 18, 2026:** Chapter 4 PR #28 merged at `176e8c1`, visual refinements #32/#33 merged at `23b165e` / `eb13de4`; owner approved desktop/mobile and exact final frontend. CI 44390775809, 44395236226 and 44396622036 passed. All twelve original artwork files retained. Port 3000 updated and Continue confirmed; four migrations current. Main documentation handoff #31 merged at `3e4a2fe`. Chapters 1–4 approved (4/5); 7/13 formal AMI issues closed. Private Master v1.13 / Script v1.11 plus subsequent explicitly approved changes are authoritative. Chapter 5 draft #30 catalog CI passed; integration pending. Real AI integrated and evaluated, currently disabled in local gameplay. #29 tracks diversity and activation. Final pause backup still owner-run. Historical notes below do not override this baseline.

---


November 17, 2026 · Day 2. PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.

The refinement notes below retain the chronology; the final acceptance summary supersedes earlier timing, text and layout descriptions.

## Implemented and accepted local subset

- Server-only DOG definition and bilingual Chapter 2 beats transcribed from Master v1.11 / Script v1.9. Existing Chapter 1 IDs/version and handoff retained; old Chapter 1 saves do not require reset.
- Four ordered choices, authored consequences, 15% CORRECT threshold, free INTRO separate from three encounter slots. Fallback only; no real inference yet.
- Injected RNG, one debit per consultation, three slots maximum, zero energy permits choice. Cached slot reused after explicit retry without reroll but costs one restored bar. Q-DOG, AMI answer, R-DOG after RANDOM and A/B/C variants use current successful attempt only; L04 cake/bananas continuity.
- CP-DOG captures the initial step, diagnostics and event flags once. Death consequence and death card precede explicit retry. Restore checkpoint while keeping attempt/revision, locale, INTRO and resolved slots outside rollback. Read-only history within the current attempt, without issuing historical choices/consultations or replaying events; history before the checkpoint is not traversable from inside the encounter.
- Additive Prisma migration records immutable checkpoint and unique resolved slot rows in the same locked transaction as JSON progress and command receipt. The current JSON includes the checkpoint and slot cache for pure transition functions; normalized rows are durable transactional records. No provider reservation yet.
- F1 is applied once on terminal interaction (35/42/53/5 locked, no recharge); SOL-01 restores 3 bars independently. MEM-D2/FB-D2 and E-NAME are authorized authored beats. Ends at Chapter 3 card; no simulated Chapter 3.
- CENA-04/05 served only at the authorized current view. Decision and retry buttons appear in the dialogue frame, not over the art. Consultation occupies its own row; portrait decision frame grows without cropping the image, with internal scrolling as a short-viewport fallback. No automatic selection on right-arrow; explicit button activation only.
- Domain tests, PostgreSQL HTTP tests and built HTTP smoke extended. Owner PT-BR/EN/mobile playtests passed; independent browser automation, extreme viewport/zoom and comprehensive accessibility checks remain AMI-010.

## Remaining boundaries

Real provider reservation/finalization, bounded retries and RAG remain AMI-007. Later rat/boar checkpoints, F2/F3, SOL-02, later memories and complete campaign are not implemented. No new artwork, inventory, paid service or production deployment.

## Owner playtest refinement — November 17

- Chapter 1 E-JOIN narration shortened and information divided into three localized beats (77 Chapter 1 steps including its card; original IDs preserved except the retired solar tutorial ID, normalized on resume/review). Information uses red/coal and ivory arrows only.
- Chapter 2 begins with three dark second-person narration beats toward the maintenance terminal, noises among vehicles and closer observation. Reveal CENA-04 with a single 520ms impact cue after load; no repeated motion. Revised punctuation and two illustrated warning narration beats precede decisions.
- Active decisions expose no PREVIOUS action. Consultation and outcome boundaries cannot be crossed backwards. Four choices retain order and outcome; consequences address the player and refer to the creature. Death card uses “VOCÊ NÃO SOBREVIVEU” / “YOU DID NOT SURVIVE” and an inline pixel skull on coal; successful consequence and A/B/C dialogue remain dark until terminal art.
- Continue opens a submenu with exact resume or Chapters. The server projects only reached chapter titles, authorizes CHAPTER/RESTART/N under the normal revision/receipt lock and preserves the highest unlocked chapter, run-wide INTRO and immutable resolved slots. Chapter 1 resets its start state; Chapter 2 restores the canonical entry state (initial diagnostics and prior Chapter 1 events); Chapter 3 restores the reached chapter-start snapshot, presently a development boundary. Restart changes current resume position only after confirmation; no separate simultaneous save slots. Existing session cookies/rows remain compatible; previous candidate checkpoint L01 is retained. New Game remains a distinct run.
- The normalized CP-DOG row is reused on chapter replay, and resolved slot rows are never duplicated or rerolled. A chapter replay may restore energy but consumes one bar for each reused consultation. No provider calls or new DB schema.

## Second owner playtest refinement — November 17

- Three red information cards; shorten the third to accurate answers and remove the solar tutorial. Existing solar dialogue and energy mechanics remain unchanged. Retired tutorial cursors normalize to adjacent surviving beats.
- After any successful dog branch, three short second-person narration beats on coal describe reaching the terminal, placing AMI by the panel and the component search. Only then reveal CENA-05 with L01; no restoration occurs before the existing F1 interaction.
- MEM-D2 starts with Ai!/Ow! and a one-shot 1050ms blink closing to coal, then dark pain, unlabeled ellipsis, familiar voice and AMI call. L15 restores the same terminal art using the existing wake cue. L18/L18b/L18c separate the recognition; E-NAME is applied at L18c exactly once. Existing saves at MEM-D2/F01/L18 or later remain readable; events already applied are not repeated. No new asset or event, change to choice/energy/replay rules, or DB migration.
- Red pixel skull; energy label and three bars only (accessible count retained). All other UI/layout is unchanged.

## Third owner playtest refinement — November 17

- Short menu labels and chapter numbers only; remove visible memory percentages/lock, enlarge centered energy bars. The complete memory state remains persisted and authoritative; F1/F2/F3, personal unlock and CORRECT probabilities stay unchanged. The existing API projection is retained for compatibility; only presentation changes.
- Revise ARRIVAL-03, add FOUND with one-shot terminal fade-in and unchanged L01, replace cake L04 wording (keep no-recipe bananas variant), divide F01/F01b and shake text at MEM-D2. All new beats are bilingual. Existing saves and event IDs remain valid.
- Solar planning check: SOL-01 is mandatory after the dog before leaving the region, SOL-02 after the rat/laboratory before the military route. Both restore three bars independent of memory restoration. Current SOL-01 applies on the L08 interaction leading into the existing explanation L09; no explicit sun-exposure narration yet. SOL-02 is planned, not implemented. Do not add charging during encounters or equate the terminal with a power source. A more explicit solar transition requires owner approval; this refinement does not change solar mechanics.

## Fourth owner refinement — November 17

Remove repeated component wording; localized ARRIVAL-03/FOUND/L01 only. Continuous memory text motion is limited to the six specified Chapter 1 memory beats and the three specified Chapter 2 beats. Animate ??? to DAVID on L18c with unchanged server name/event. The experimental CENA-04 geometry override was reverted after owner review; keep the approved pre-refinement layout. No original asset changes, database/dependency changes or solar timing changes. Verify all scene hashes and current HTTP asset bytes in smoke; browser verification pending.

## Owner correction — November 17

Revert the dog-wide geometry override exactly to the approved b9da1be layout. Use the same owner-approved L04 text for every success variant (no bananas substitution); keep all A/B/C branch logic and cache intact. Slow name-reveal to 1800ms, preserve memory-shiver scope and image hash verification. No other story, layout, state or asset changes.

## Targeted owner refinement — November 17

Energy indicator gently appears on the first tutorial card and stays visible on the remaining information cards. Dog reveal uses a temporary coal veil and brief visual-layer translation rather than transforming the PNG; no layout resize. Insert L08b before solar explanation, retain SOL-01 application on entry to L09 with existing independent recharge semantics and stable L08/L09 IDs. Name alternates ???/DAVID over 2600ms and settles on DAVID. No other story, energy, asset, layout, cache or replay changes. Browser validation pending.

## Latest owner refinement — November 17

Only ARRIVAL-03 wording, FOUND dark/L01 terminal fade-in, dog reveal timing and L18c name animation change. The same original CENA-04 and CENA-05 files remain authorized at their illustrated beats; no duplicate art, layout, energy, event or persistence changes. Tests assert dark FOUND and stable CENA-05 across adjacent illustrated beats.

## Final accepted baseline (supersedes earlier refinement details)

- Chapter 1: 77 beats, three red information cards; the first reveals the energy-only HUD with two gentle pulses. Dog: original CENA-04 on L01, 1450ms veil/shake with 435ms initial dark hold after load; same asset on L02 and following illustrated beats, normal approved geometry, no persistent motion. Decision-only compact grid, no PREVIOUS. Red pixel skull and explicit retry; success consequence/branches dark.
- Terminal: exact ARRIVAL-03 “Você observa AMI se conectar ao sistema enquanto emite breves sons eletrônicos.”; FOUND “Encontrado.” remains dark; original CENA-05 appears on L01 with 700ms veil. All L04 variants use “Então vai parar de falar coisas aleatórias?”. F1 35/42/53/5 locked; SOL-01 independent on entry to L09 after L08b. Continuous tremor only FB-D1b–g, MEM-D2, F01/F01b; name reveal at L18c alternates over 1500ms. Chapter 3 boundary only.
- All original 12 PNGs/manifest unchanged. Chapter selection keeps unlocked progress and cached slots; restart replaces resume position only after confirmation. AMI-005 accepted and issue #7 closed completed. AMI-006 remains partial; real inference is AMI-007, rat/lab and F2/SOL-02/MEM-D3 are AMI-008.
