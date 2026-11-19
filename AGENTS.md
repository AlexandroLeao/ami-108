# AMI-108 — Engineering instructions

## Day 4 candidate — November 19

Private Master v1.14 / Script v1.12 are now synchronized; cumulative approved amendments take precedence. This branch integrates the Chapter 5 candidate from #30, not an owner-approved baseline. No changes to Chapters 1–4 or expanded AI behavior. Main remains `fd0a906` until exact CI and owner preview acceptance. Preserve original artwork and fixed boar answer; no paid resources.


## Current authoritative instructions — November 18, 2026

- F1/F2/F3 restore energy and memory atomically; F3 unlocks PERSONAL and all four indexes reach 100%. No new solar actions; legacy SOL IDs remain for old saves.
- Chapters 1–4 are owner-approved. Preserve the exact approved dialogue, art, UI, current-only gates and replay. Selected wake and creature reveals block forward navigation until loaded/effect completed; dog/rat gradual reveal plus existing shake, Chapter 4 CRT memory effects, David memory text shiver and hidden energy HUD are approved. Reduced motion remains supported.
- PRs #24/#35/#36 merged; AI opt-in active on last observed four-CPU local VM, disabled by default on fresh installs; #29 closed. Preserve category authority, deadlines, cache and fallback. No paid services.
- Next: draft #30, Chapter 5 and CP-BOAR. Reconcile against current main before integration. No changes to accepted content without owner authorization.

**Current accepted baseline — November 18, 2026 (Belém; November 19 UTC):** Chapters 1–4 owner-approved (4/5, 80%); formal AMI issues 7/13 (53.8%) closed, plus release follow-up #29 completed. F3 restores all four memory indexes and energy atomically, PERSONAL unlocked. Original twelve assets retained; Master v1.13 / Script v1.11 and later approved amendments remain authoritative. PR #28 merged `176e8c1`, visual refinements #32/#33 `23b165e`/`eb13de4`; AI diversity #35 `f9c89c9` and expanded pool #36 `ec61f29` merged after owner acceptance and exact-head CI 44426011328/44428871649. Local port 3000 installed `ec61f29` with Qwen2.5:1.5b (65ec06548149), Ollama internal-only, 24 authorized bilingual RANDOM options, at most three sampled, exact validation, unchanged 15/42/100 probability, energy, immutable slots, recipe metadata and 2 s/2.5 s deadlines. Direct expanded benchmark 81/82 with 21/24 distinct; browser 7/7, DOG three distinct RANDOM and RAT mixed categories. Latest live log 10/10 direct regression, two sessions retained, verified pre-expanded backup, API/AI/DB healthy and web starting immediately after restart. No new migrations or paid resources. Chapter 5 draft #30 `ffb28db` isolated domain/catalog CI 44421224642 green, not integrated; reconcile with current main before CP-BOAR, engine, persistence, UI, final dialogue and credits. Full campaign QA, deployment, final docs and release remain open. See development handoff for safe pause/resume; historical snapshots do not supersede this baseline.

---


## Source of truth and scope
- Use the approved Documento Mestre v1.13 and Roteiro Interativo v1.11 plus later explicitly owner-approved changes; the November 16 cumulative addenda take precedence over the historical source pages; the November 17 owner-approved PR #22 amendments take precedence for the specifically approved changes now incorporated in the November 17 cumulative private-source supplement. Do not invent or rewrite dialogue, outcomes, encounters, assets, or story reveals. If the source is unavailable, ask for the relevant authorized excerpt before implementing that content.
- Five chapters (Bananas; Registro Atualizado; Pensamento Positivo; AMI-108 & David; De nada, Bobo), 12 narrative scenes, 12 scene assets and 9 internal reference sheets. Preserve stable narrative IDs. Chapter 1 title and its banana dialogue are fixed.
- Static 16:9 scene art and coded UI. Palette #171717, #FDF3E9, #FC2721. No audio, inventory, movement, animated sprites, real-time combat, free chat or extra endings.
- Preserve the approved UI in docs/ui-design.md. A01-S01 has a silent ellipsis and L01a/L01b presentation subdivision; L02–L04 remain unchanged. Dark first three beats, blink/blur overlay on L02, one-shot text tremor through L02, steady L03 onward. The owner’s PR #20 playtest refinement adds departure/arrival narration, two later blink reveals, revised Bobo beats, AMI-108 speaker label and short subdivisions; see docs/ui-design.md. PR #20 merged after owner acceptance; review all reached presentation from L02 onward, including already-applied events and Chapter 2 handoff, without rollback or replay. See docs/ui-design.md for the final robot frame, fixed-height title/Menu header diagnostics, E-JOIN/information and MEM-D1 revisions. No visible arrow captions or hover tooltips. The accepted technical presentation refinements are recorded in the repository synchronized with the private cumulative source revisions on November 17. The chapter card waits for manual advance; previous dialogue is read-only history, not game-state rollback.
- PT-BR and EN are first-class; preserve AMI-108 and Bobo in both. Four fixed David headache/black-screen flashback transitions, not generated by AI.

## Architecture and rules
- Next.js/React renders the authorized current scene. NestJS is authoritative for state, transitions, choices, energy, memory, checkpoints and persistence. PostgreSQL/Prisma persists progress. Python/FastAPI/Pydantic generates and validates only permitted AMI dialogue.
- Three encounters in order: dog (chapter 2), rat (chapter 3), boar (chapter 5). Lizard is flashback only. Four choices per encounter, one safe, three lethal. Outcomes are deterministic, never chosen by the LLM.
- Energy starts at 3 after E-JOIN; each encounter consultation costs one, at most three; F1/F2/F3 restore energy to 3 atomically with memory. No negative energy; zero energy does not block choices. Ordinary dialogue, flashbacks, restorations, and INTRO-RANDOM cost no energy.
- F1/F2/F3 are fixed, idempotent restoration events. Initial BIO-02 15%, F1 42%, F3 100%; these are approved initial CORRECT probabilities for dog, rat and boar respectively. PERSONAL stays locked until F3.
- Roll back checkpoint state only on explicit return; keep consultation slot categories and cache outside rollback. Duplicate requests cannot debit twice; language changes cannot reroll. Maximum nine encounter slots plus one INTRO-RANDOM per run.
- NestJS selects CORRECT/RANDOM, FastAPI retrieves only authorized encounter facts and generates/validates the wording. Use authored localized fallback on invalid/unavailable generation. CORRECT is guaranteed for the boar. Never send future spoilers, unrelated private facts or secrets to a provider.
- No secret, private storyline dump or solution key in public client payloads. Gate spoilers by state, including asset delivery; do not assume a public asset URL is secret.

- Use the reviewed architecture documents under docs/architecture and proposed contracts under docs/api. Do not claim unimplemented game behavior; record changes to the design via ADRs.

## Engineering workflow
- Use English for repository documentation, ADRs, issues, PRs, commit messages, code identifiers and comments; preserve localized PT-BR/EN game content verbatim. Owner-facing reports and private official documents remain in Portuguese.
- Follow the seven-day target (November 16–22, 2026) in docs/production-plan.md. Do not cut approved scope, bypass verification or claim completion to meet a date.
- Google Cloud Shell is the verified manual development environment; Codespaces is optional and untested. AWS CloudShell is only for authorized AWS operations. Stop unused compute, verify quotas and do not expose keys.
- Keep main stable. Use short branches and PRs with scope, acceptance criteria, tests and known limitations. Do not merge without owner approval.
- Write tests alongside changes; inject RNG/provider for deterministic tests, validate contracts, handle concurrency and idempotency. Never fabricate test results. Report commands actually run and failures.
- Prefer simple modular solutions and pinned dependencies with lockfiles. No paid mandatory services, no cloud resource creation or billing changes without approval. Verify quota and eligibility before deployment.
- Use environment variables for secrets; .env.example contains placeholders only. Do not commit credentials, local artifacts, or personal/private files.
- Update technical docs and ADRs as decisions are made; preserve narrative sources and originals. Do not mark unimplemented capabilities as complete.

- November 17 owner refinement in PR #22: concise E-JOIN narration and three red information cards, three dark dog approach beats and a single loaded-art startle cue, two warning beats, no PREVIOUS at active decisions, dark consequences/branches, pixel skull death card and persistent chapter selection under Continue. Preserve unlocked high-water mark and immutable consultation slots on explicit chapter restart; no new story events, assets or mechanics beyond this authorized presentation/replay amendment. See docs/encounter-engine.md and docs/ui-design.md. Private cumulative source update follows owner acceptance.

- Second owner refinement: remove the solar tutorial card (normalize retired saved cursor), shorten accurate-answer information, three dark terminal-arrival beats, MEM-D2 blink-to-black and silent/voice/AMI call, wake on L15, three recognition beats with E-NAME at L18c, red skull and energy bars without numeric fraction. Keep F1/SOL-01, cache, chapter selection and unrelated presentation intact.

- Third owner refinement: abbreviated Continue/Chapter labels, energy-only enlarged HUD (memory rules and persisted values unchanged), revised ARRIVAL-03, FOUND fade-in, revised cake-related L04, split F01/F01b and MEM-D2 pain text. Preserve SOL-01 timing and planned SOL-02, no unapproved solar mechanics or other story/UI changes.

- Fourth owner refinement: reduce repeated storage-component wording, continuous memory-shiver only FB-D1b–g/MEM-D2/F01/F01b, one-shot name-reveal on L18c, original approved CENA-04 geometry (experimental override reverted after owner review), manifest and HTTP artwork hashes checked. Preserve original art, stable IDs, event effects, chapter replay and solar mechanics.

- Owner correction: preserve the exact b9da1be layout for normal dialogue and choices; do not adjust image or frame dimensions without specific owner approval. A02-S02/L04 has one localized text for all success variants; no recipe-dependent alternative. Name reveal 1800ms; no unrelated changes.

- Targeted owner refinement: energy-reveal on first information card, same CENA-04 with one-shot veil/brief layer shake, L08b solar lead-in (SOL-01 still on entry to L09), alternating name reveal 2600ms. No changes to approved dimensions or other dialogue, rules or artwork.

- Latest owner refinement: exact shortened ARRIVAL-03; dark FOUND and L01-only CENA-05 veil; slower dog reveal with text first; faster distinct ???/DAVID alternation. No other changes to text, layout, original assets or mechanics.

## Accepted Day 2 baseline

PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes).

Private Master v1.12 / Script v1.10 are synchronized on November 17, 2026; the cumulative Day 2 supplement takes precedence for explicitly approved changes, with all prior pages and source text preserved. The three existing Drive files were replaced in place; the asset ZIP v1.9 is unchanged. No private source files are committed.

- Final rules supersede earlier refinement notes: 77 Chapter 1 beats; three red information cards with energy reveal on the first; energy-only HUD; exact pre-dog-resize approved geometry; no back at decisions; dark success, red skull, chapter-number-only replay. ARRIVAL-03 exact shortened wording, FOUND dark, L01 original CENA-05 with 700ms veil, dog L01 1450ms reveal with 435ms initial dark hold after load, L18c 1500ms alternating name reveal. All branches use the same approved L04. SOL-01 on entry to L09 after L08b. Do not change approved dialogue, dimensions, assets, or rules without explicit owner authorization. Earlier refinement descriptions are historical, not current instructions.
- Next AMI-007/008; AMI-006 partial. Preserve the approved baseline and use a new feature branch. No paid service, real provider or public deployment without separate verification/authorization.
