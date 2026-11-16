# Retro game presentation

**AMI-003 · owner-approved direction, November 16, 2026**

The visual preview establishes a reusable game shell; it is not the authoritative campaign. Keep the approved three colors (#171717, #FDF3E9, #FC2721), the 12 existing scene images and the source narrative. A new menu illustration is explicitly deferred.

## Presentation

- VT323 regular, locally bundled via pinned @fontsource/vt323 5.2.7 (OFL-1.1; Peter Hull / VT323 Project Authors). No third-party font request in the browser. License is distributed with the dependency; see https://fontsource.org/fonts/vt323/about.
- A viewport-constrained desktop/mobile shell, scene above dialogue, fixed rectangular double-line frame, speaker on its first line and back/forward pixel arrows at the bottom right. Do not crop scene art. Keep the scene area stable across dialogue beats; shrink the art rather than hide text or controls. Extremely small viewports or accessibility zoom may require overflow rather than inaccessible clipping.
- Main menu: New game, Continue game, Language, Extras. No additional main menu options. The title is a custom crisp pixel-glyph wordmark: ivory AMI- and red 108, with no underline. Continue game stays visibly dimmed (without strikethrough) unless the server confirms a saved session. The isolated preview still disables it.
- Extras: three paginated, bilingual cards for project concept, credits, references and technology; display actual development version v0.0.0. Credit Alexandro Milhomes Leão for original concept, writing, creative direction, visual concept and technical leadership; keep in-game credits concise. AI-assisted implementation is documented in the technical project materials. Font attribution remains in the technical documentation and license, not in the in-game Extras. Inspiration includes classic adventures, RPGs, horror games, Pokémon and Adventure Time. No borrowed art or branding.
- Language preference persists locally; the game shows no language toggle outside the menu. In-game menu: Continue, Language, Back to main menu. Pause retains the current line. The local campaign uses server-authoritative locale mutation, preserving progression and INTRO state.
- Pointer/touch controls, Tab/Enter/Space through native buttons, Right Arrow to advance, Left Arrow to revisit the previous dialogue beat, and Escape to pause/back. Visible keyboard focus, modal focus cycling, reduced-motion support. No rapid flashing, audio or added game mechanics.

## Chapter 1 campaign integration (PR #20)

Keep the approved visual shell, same 16:9 art and chapter/scene geometry. The root renders authorized server projections; `/preview` remains the original fixture. After E-JOIN only, show compact energy bars and four memory values in the header. Long dialogue is paginated within the fixed box, using measured font/viewport dimensions; local page navigation does not advance authoritative state. The server-authorized previous action uses the owner-approved history policy below. No added choices. A new game confirmation protects an existing resume target. Verify these additions on desktop/mobile before acceptance. The initial three beats are dark; wake overlays are mounted only after the current image has loaded. Keep the identical asset URL and image element between L02 and L03.

## Opening sequence

The owner approved a presentation-only revision of A01-S01/L01: add an initial silent ellipsis, then split the initial sentence into two dialogue beats without renumbering subsequent canonical dialogue IDs. Preserve the remaining lines verbatim. The approved UI presentation is synchronized in the November 16 addenda of private Documento Mestre v1.10 and Roteiro Interativo v1.8.

| Beat | PT-BR | EN | Visual |
| --- | --- | --- | --- |
| Chapter card | CAPÍTULO 1 — BANANAS | CHAPTER 1 — BANANAS | Same persistent game frame as dialogue: menu visible from the start, blank dialogue box, dark scene field for about 1.4 s, gradual title reveal. Both arrows are visible from the start, dimmed and disabled. At 3.4 s enable only the forward arrow, smoothly restoring its opacity over 280 ms. Fade out the chapter title without changing layout; wait indefinitely for player input. |
| Opening silence | ... | ... | Completely dark scene field; one brief text tremor |
| L01a | Que merda... | Shit... | Completely dark scene field; one brief text tremor |
| L01b | Minha cabeça... | My head... | Completely dark scene field; one brief text tremor |
| L02 | Onde eu estou? | Where am I? | First and only image reveal: eyelids open, briefly close and reopen over 1.4 s; mild blur resolves over 1.4 s on a separate optical overlay, not on the image itself; one brief text tremor. Same mounted, unfiltered CENA-01 throughout. |
| L03 | Sangue...? | Blood...? | CENA-01 fully open and sharp; all waking effects and text tremor stop |
| L04 | Que diabos aconteceu aqui? | What the hell happened here? | CENA-01 visible |

Speaker is `???`. The owner clarified that the first three dialogue beats must remain fully dark. Only L02 reveals the scene: one deliberate blink (open, close, reopen) and short blur-to-focus transition. On each of the first four beats the newly displayed text shakes once for 0.38 s (the initial ellipsis uses a slightly more perceptible 0.48 s), then stays still; no infinite animation. L03 and L04 have fully open, sharp, steady vision and text, even when the player advances before the animation finishes. Returning to L02 replays the reveal; returning to any of the first three beats hides the art completely. No automatic dialogue advancement or looping eyelid flashes. Previous dialogue is bounded within the opening, never crossing a choice, event or checkpoint; future authoritative gameplay must implement read-only dialogue history rather than reverse irreversible game state. Changing locale or pausing does not rewind the preview. Reduced-motion preferences bypass movement. Opening is not a memory flashback.

## David memory transitions

Reusable cues are defined for MEM-D1–D4: show the existing authored pain line (brief subtle tremor), then coal-black cut, then the existing memory block, then return to the present. Do not replace canonical wording, alter AMI memories, add new assets or trigger extra events. FB-D4/D5 remains one continuous block. AMI-004/008/009 must connect the cues to the actual server-authorized narrative events; the preview does not implement them.

## Validation matrix

- Owner validated the original bilingual preview and accepted the final redesign on desktop and mobile on November 16; PR #18 merged after CI passed. Full manual accessibility/zoom verification remains AMI-010.
- Test root and /preview in local Compose, both locales, menu/options, three extras cards, disabled resume, chapter reveal, always-visible dimmed arrows, smooth enablement after 3.4 s and indefinite manual-only advance, three fully dark beats, one short text tremor on each of the first four beats, single blink and blur-to-focus on L02 only, complete stabilization at Blood, stable image focus, previous/next dialogue and remaining dialogue, pause/language/resume without line reset, keyboard and reduced motion.
- Check 1366×768 and 1920×1080 desktop, mobile portrait 360×640 and 390×844, mobile landscape 640×360, plus zoom and keyboard focus. No page scrolling at standard sizes; do not crop or hide the next button. Validate actual rendered layout before claiming success.
- Retain local-only preview flag, gated CENA-01 route and server-only future assets. No saved game, full campaign, LLM inference or production deployment in this PR.

## Owner playtest refinement — PR #20 (November 16)

Keep the original opening, menu, art, HUD, save, locale and flashback behavior. After A01-S01/L04, fade the already displayed warehouse to coal and show two narrated beats. Reveal CENA-02 with the existing blink/focus overlay on the new street reaction. Four short localized narration beats describe the melody and investigation; fade to coal for the existing two David lines and two entry narration beats. Reveal CENA-03 with the same blink/focus on David's silent ellipsis, then retain the original robot greeting. The Bobo exchange uses three short owner-requested beats; the revealed robot speaker is AMI-108. Split L09, L11, L12, L18 and L31 without changing their combined wording. Narration is labelled NARRAÇÃO/NARRATION in the existing red and VT323. Remove the two obsolete transition action captions and visible dialogue pagination counts; keep local measured pagination as a readability fallback. Extras page numbers remain unchanged. Previous is available across reached pre-join narration, dialogue and art, with an unchanged event boundary at E-JOIN. Preserve original IDs so existing saves remain addressable; already-passed additions can be experienced on a new run. No new asset or mechanic. The isolated /preview is unchanged; owner validates root.

## Second owner playtest refinement — Chapter 1

Robot/AMI-108 speech reverses the approved ivory/coal frame and lettering; David, narration and information retain coal/ivory. Keep the red arrows, VT323, art, and menu geometry. Move the diagnostics from the header into a compact absolute overlay at the scene's upper right; show it on illustrated beats only after E-JOIN, so neither its appearance nor its absence changes artwork dimensions. E-JOIN is second-person narration on coal (no harness jargon); the unchanged tutorial is labelled INFORMAÇÃO/INFORMATION on coal, followed by one dark return-to-street narration and the existing street art. Keep the original headache dialogue, close eyelids at FB-D1, present seven short dark narrated beats, then reuse wake optics on a new David ellipsis before L35. Review can traverse all reached beats from L02 onward, including already-applied events, flashback, tutorial and Chapter 2 handoff. The initial card and three dark opening beats cannot be revisited by new PREVIOUS commands. No event, energy, INTRO result or authoritative progress is undone. Hide diagnostics when reviewing earlier than E-JOIN. Preserve IDs and legacy saved review cursors; no asset changes or added mechanics. Existing visual fixture remains unchanged. This addendum supersedes prior Chapter 1 review/flashback presentation rules; owner revalidation pending.

## Third owner playtest refinement — header and arrows

Replace the in-art diagnostics overlay with a compact status strip centered between the existing AMI-108 title and Menu button, inside the same 44px header row. Group energy and the four memory metrics; use two compact memory columns and width-dependent wrapping within the strip, not additional header rows. Use PESSOAL in PT-BR and PERSONAL in EN. A small outline padlock replaces the redundant written lock status; retain the localized accessible status. The personal memory restriction and all values are unchanged. Hide diagnostics on dark beats as before. Remove every visible action caption and native hover tooltip from the campaign arrows, retaining localized accessible arrow labels and the same server action IDs/kinds, including L38. No changes to art, dialogue text, narrative events, save schema, layout outside the header, palette, menus, or isolated preview. This supersedes the second refinement's in-art HUD placement.
