# Retro game presentation

**AMI-003 · owner-approved direction, November 16, 2026**

The visual preview establishes a reusable game shell; it is not the authoritative campaign. Keep the approved three colors (#171717, #FDF3E9, #FC2721), the 12 existing scene images and the source narrative. A new menu illustration is explicitly deferred.

## Presentation

- VT323 regular, locally bundled via pinned @fontsource/vt323 5.2.7 (OFL-1.1; Peter Hull / VT323 Project Authors). No third-party font request in the browser. License is distributed with the dependency; see https://fontsource.org/fonts/vt323/about.
- A viewport-constrained desktop/mobile shell, scene above dialogue, fixed rectangular double-line frame, speaker on its first line and back/forward pixel arrows at the bottom right. Do not crop scene art. Keep the scene area stable across dialogue beats; shrink the art rather than hide text or controls. Extremely small viewports or accessibility zoom may require overflow rather than inaccessible clipping.
- Main menu: New game, Continue game, Language, Extras. No additional main menu options. The title is a custom crisp pixel-glyph wordmark: ivory AMI- and red 108, with no underline. Continue game stays visibly dimmed (without strikethrough) and disabled until actual session resume is implemented.
- Extras: three paginated, bilingual cards for project concept, credits, references and technology; display actual development version v0.0.0. Credit Alexandro Milhomes Leão for original concept, writing, creative direction, visual concept and technical leadership; keep in-game credits concise. AI-assisted implementation is documented in the technical project materials. Font attribution remains in the technical documentation and license, not in the in-game Extras. Inspiration includes classic adventures, RPGs, horror games, Pokémon and Adventure Time. No borrowed art or branding.
- Language preference persists locally; the game shows no language toggle outside the menu. In-game menu: Continue, Language, Back to main menu. Pause retains the current preview line. The future server-authoritative locale mutation must preserve progress and consultation state.
- Pointer/touch controls, Tab/Enter/Space through native buttons, Right Arrow to advance, Left Arrow to revisit the previous dialogue beat, and Escape to pause/back. Visible keyboard focus, modal focus cycling, reduced-motion support. No rapid flashing, audio or added game mechanics.

## Opening sequence

The owner approved a presentation-only revision of A01-S01/L01: add an initial silent ellipsis, then split the initial sentence into two dialogue beats without renumbering subsequent canonical dialogue IDs. Preserve the remaining lines verbatim. Treat the following as the approved UI override pending synchronization of the private canonical documents.

| Beat | PT-BR | EN | Visual |
| --- | --- | --- | --- |
| Chapter card | CAPÍTULO 1 — BANANAS | CHAPTER 1 — BANANAS | Same persistent game frame as dialogue: menu visible from the start, blank dialogue box, dark scene field for about 1.4 s, gradual title reveal. At 3.4 s enable the advance arrow in the usual dialogue position. Fade out the chapter title without changing layout; wait indefinitely for player input. |
| Opening silence | ... | ... | First blink, narrow blurred vision, gentle recurring text tremor |
| L01a | Que merda... | Shit... | Second blink, slightly wider and clearer vision, text tremor |
| L01b | Minha cabeça... | My head... | Another blink, gradual focus, text tremor |
| L02 | Onde eu estou? | Where am I? | Final blink opens fully over 1.55 s, mild residual blur, text tremor. Same mounted CENA-01 throughout. |
| L03 | Sangue...? | Blood...? | CENA-01 fully open and sharp; all waking effects and text tremor stop |
| L04 | Que diabos aconteceu aqui? | What the hell happened here? | CENA-01 visible |

Speaker is `???`. The approved waking sequence now begins with the ellipsis: each of the first four beats triggers a single deliberate close/reopen of the eyelids, with progressively wider vision and decreasing blur (5, 4, 3, 0.8 px). Text tremor continues gently while those beats are active. L03 and L04 have fully open, sharp, steady vision and text. Returning to a waking beat restores that beat's visual cue without replacing the image. No automatic dialogue advancement or looping eyelid flashes. Previous dialogue is bounded within the opening, never crossing a choice, event or checkpoint; future authoritative gameplay must implement read-only dialogue history rather than reverse irreversible game state. Changing locale or pausing does not rewind the preview. Reduced-motion preferences bypass movement. Opening is not a memory flashback.

## David memory transitions

Reusable cues are defined for MEM-D1–D4: show the existing authored pain line (brief subtle tremor), then coal-black cut, then the existing memory block, then return to the present. Do not replace canonical wording, alter AMI memories, add new assets or trigger extra events. FB-D4/D5 remains one continuous block. AMI-004/008/009 must connect the cues to the actual server-authorized narrative events; the preview does not implement them.

## Validation matrix

- Owner previously validated original opening preview in PT-BR/EN and mobile; redesigned preview needs new acceptance.
- Test root and /preview in local Compose, both locales, menu/options, three extras cards, disabled resume, chapter reveal and indefinite manual-only advance, four gradual waking blinks and text tremor, complete stabilization at Blood, stable image focus, previous/next dialogue and remaining dialogue, pause/language/resume without line reset, keyboard and reduced motion.
- Check 1366×768 and 1920×1080 desktop, mobile portrait 360×640 and 390×844, mobile landscape 640×360, plus zoom and keyboard focus. No page scrolling at standard sizes; do not crop or hide the next button. Validate actual rendered layout before claiming success.
- Retain local-only preview flag, gated CENA-01 route and server-only future assets. No saved game, full campaign, LLM inference or production deployment in this PR.
