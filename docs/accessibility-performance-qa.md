# Browser accessibility and performance verification — AMI-010

## Scope and baseline

The five-chapter campaign and visual presentation are owner-approved and frozen. Review the accepted runtime `14ea583` (PR #53), which includes the earlier security baseline `f89c342` (PR #48), preserving the original 12 artwork hashes, dialogue, layout, cinematic timing and game rules. This is a verification plan and source review, not a browser audit result or a claim of WCAG conformance. Do not use real saves for destructive checks or start a new game in the owner's existing browser profile.

## Latest owner-observed browser increment — November 20, 2026

On the recovered private port-3000 preview, the owner **reported PASS** for keyboard-only operation of menu/dialogue/buttons and for 200% browser zoom readability/usability, in addition to Continue. The precise browser/device/locale was not recorded. Preserve this result as **manual, locale-unspecified evidence**; it does **not** replace full modal focus, PT-BR/EN screen reader, reduced motion, automated WCAG or measured performance cases. See the [final QA worksheet](final-qa-acceptance-worksheet.md) for the non-duplicated gate matrix.

## Source review — November 19, 2026

| Existing implementation | Source | Evidence still required |
| --- | --- | --- |
| Native buttons, visible focus outline, menu label, localized main lang, arrow and Escape shortcuts | campaign-game.tsx; globals.css | Tab/Shift+Tab order, focus after cinematic gates and overlay return, keyboard-only game |
| Dialog aria-modal, inert/aria-hidden background, Tab wrap | campaign-game.tsx | Focus stays in dialog; Escape and Back restore a meaningful control; no focus lost when all controls temporarily disabled |
| Dialogue polite live region, choice group, death status and error alert | campaign-game.tsx | Actual screen-reader announcements in PT-BR and EN; no duplicated or skipped dialogue |
| Current scene image alt, load gating and retry | campaign-scene.tsx | Alt matches current scene without spoilers; retry accessible and focus reachable when load fails |
| Reduced-motion queries and CSS, scrollable reduced-motion credits | campaign-game.tsx; campaign-scene.tsx; globals.css | Reduced-motion mode on actual device; no forced delays, unreadable text or blocked navigation |
| Content advisory and Extras | content-warning.tsx; campaign-game.tsx | Localized title, button labels/order, no session created by Back |
| Responsive layout and measured dialogue pagination | globals.css; pagination.ts | Text at 200% browser zoom and narrow/short viewport; no clipped controls or unreachable text |

Review targets, not confirmed defects: automatic focus effect during readiness/busy transitions, global arrow shortcuts versus scrolling, dialog focus when controls are disabled, credits at reduced motion, and fixed viewport/overflow interactions at high zoom. Record reproduction before proposing a change; do not modify approved presentation silently.

## Owner browser checklist

Use the same private port 3000 origin and browser for the existing Continue verification only. After confirming the existing save, use a separate private browser profile/window for any new-session test; close it afterward. Never clear the owner's browser data, share cookies or record save tokens. Record date, exact runtime commit, browser/version, OS/device, viewport, locale, result (pass/fail/not tested) and a brief reproducible note.

| ID | Check | Pass condition |
| --- | --- | --- |
| A01 | Main menu keyboard only | All enabled controls reachable and focus visible; disabled Continue cannot be activated |
| A02 | Warning/Language/Extras/Pause/Continue dialogs | Tab/Shift+Tab stay inside; Escape/Back return predictably; background inert |
| A03 | Dialogue and choices | Arrow shortcuts and Enter/Space work; choices reachable; no action skips image/cinematic gate |
| A04 | PT-BR and EN announcements | Screen reader announces meaningful headings, dialogue, choices, errors and current language |
| A05 | Reduced motion | Enable OS/browser preference; wake/reveals/credits remain readable and progressable |
| A06 | 200% zoom | Menu, warning, dialogue, choices and controls remain reachable; no lost text |
| A07 | Mobile portrait and short landscape | Scroll/reflow allows all controls and text; no clipped choice or navigation |
| A08 | Artwork/error recovery | In disposable session, current image alt and retry usable; no future scene fetched |
| A09 | Continue and language switch | Owner's existing save resumes at expected position; locale changes preserve progress |
| A10 | Automated browser scan | Record tool/version and page/state; triage results manually, do not treat scan alone as conformance |

## Performance evidence

Record actual hardware (CPU/RAM), browser, network/preview route, viewport and sample count. Compare cold versus warm navigation and image loading in a disposable session, without repeating costly inference. Capture browser Performance/Network timings, image transfer sizes, long tasks and any visible stutter; report medians and range rather than extrapolated capacity. For backend readiness, collect repeated read-only health endpoint timings and container resource snapshots. Health latency is not gameplay or AI latency. Reuse the documented pinned-model 10/10 evaluation as a historical baseline, not a new gameplay receipt. Do not capture or share request cookies, authorization headers, full HAR files, dialogue spoilers or secrets.

## Acceptance

Keep #12 open until actual manual and automated browser evidence, measured performance and production security gates are reviewed. No new dependency, paid resource, public hosting, live data mutation, UI change or accessibility certification is introduced by this plan.
