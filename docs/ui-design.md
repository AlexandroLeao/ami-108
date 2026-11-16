# Retro game presentation

**AMI-003 · owner-approved direction, November 16, 2026**

The visual preview establishes a reusable game shell; it is not the authoritative campaign. Keep the approved three colors (#171717, #FDF3E9, #FC2721), the 12 existing scene images and the source narrative. A new menu illustration is explicitly deferred.

## Presentation

- VT323 regular, locally bundled via pinned @fontsource/vt323 5.2.7 (OFL-1.1; Peter Hull / VT323 Project Authors). No third-party font request in the browser. License is distributed with the dependency; see https://fontsource.org/fonts/vt323/about.
- A viewport-constrained desktop/mobile shell, scene above dialogue, fixed rectangular double-line frame, speaker on its first line and a red pixel arrow at the bottom right. Do not crop scene art. Keep the scene area stable across dialogue beats; shrink the art rather than hide text or controls. Extremely small viewports or accessibility zoom may require overflow rather than inaccessible clipping.
- Main menu: New game, Continue game, Language, Extras. No additional main menu options. The title uses ivory lettering, a red hyphen and a simple red underline. Continue game stays visibly dimmed (without strikethrough) and disabled until actual session resume is implemented.
- Extras: three paginated, bilingual cards for project concept, credits, references and technology; display actual development version v0.0.0. Credit Alexandro Milhomes Leão for original concept, writing, creative direction, visual concept and technical leadership; acknowledge AI-assisted development. Font attribution remains in the technical documentation and license, not in the in-game Extras. Inspiration includes classic adventures/RPGs, Pokémon and Adventure Time. No borrowed art or branding.
- Language preference persists locally; the game shows no language toggle outside the menu. In-game menu: Continue, Language, Back to main menu. Pause retains the current preview line. The future server-authoritative locale mutation must preserve progress and consultation state.
- Pointer/touch controls, Tab/Enter/Space through native buttons, Right Arrow to advance and Escape to pause/back. Visible keyboard focus, modal focus cycling, reduced-motion support. No rapid flashing, audio or added game mechanics.

## Opening sequence

The owner approved a presentation-only revision of A01-S01/L01: add an initial silent ellipsis, then split the initial sentence into two dialogue beats without renumbering subsequent canonical dialogue IDs. Preserve the remaining lines verbatim. Treat the following as the approved UI override pending synchronization of the private canonical documents.

| Beat | PT-BR | EN | Visual |
| --- | --- | --- | --- |
| Chapter card | CAPÍTULO 1 — BANANAS | CHAPTER 1 — BANANAS | Coal-black for about 1.4 s, then gradual title reveal; at 3.4 s enable the advance arrow. Wait indefinitely for player input. |
| Opening silence | ... | ... | Dark scene field |
| L01a | Que merda... | Shit... | Dark scene field |
| L01b | Minha cabeça... | My head... | Dark scene field, brief subtle text tremor |
| L02 | Onde eu estou? | Where am I? | CENA-01 revealed by a 3.4 s eyelid animation; blurred vision holds briefly, then sharpens by 5.6 s. Manual advance may skip the remaining effect. |
| L03 | Sangue...? | Blood...? | CENA-01 visible |
| L04 | Que diabos aconteceu aqui? | What the hell happened here? | CENA-01 visible |

Speaker is `???`. The reveal runs only for L02; changing locale or pausing does not rewind the preview. Reduced-motion preferences bypass movement. Opening is not a memory flashback.

## David memory transitions

Reusable cues are defined for MEM-D1–D4: show the existing authored pain line (brief subtle tremor), then coal-black cut, then the existing memory block, then return to the present. Do not replace canonical wording, alter AMI memories, add new assets or trigger extra events. FB-D4/D5 remains one continuous block. AMI-004/008/009 must connect the cues to the actual server-authorized narrative events; the preview does not implement them.

## Validation matrix

- Owner previously validated original opening preview in PT-BR/EN and mobile; redesigned preview needs new acceptance.
- Test root and /preview in local Compose, both locales, menu/options, three extras cards, disabled resume, chapter reveal and indefinite manual-only advance, black first three lines, slow eyelid reveal and gradual focus and remaining dialogue, pause/language/resume without line reset, keyboard and reduced motion.
- Check 1366×768 and 1920×1080 desktop, mobile portrait 360×640 and 390×844, mobile landscape 640×360, plus zoom and keyboard focus. No page scrolling at standard sizes; do not crop or hide the next button. Validate actual rendered layout before claiming success.
- Retain local-only preview flag, gated CENA-01 route and server-only future assets. No saved game, full campaign, LLM inference or production deployment in this PR.
