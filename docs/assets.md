# Scene asset preparation

## Art provenance and distribution scope — November 21, 2026

The owner reports that the twelve approved scene illustrations were created with OpenAI image-generation assistance from the owner's references and creative direction. This owner statement documents provenance; it is **not** an independent audit of any third-party reference rights. The nine internal reference sheets and original source ZIP remain private. Only the derived, reviewed game PNGs and manifest belong in the repository.

Under [OpenAI's Terms of Use](https://openai.com/policies/terms-of-use/), as between the user and OpenAI, and to the extent permitted by applicable law, the user owns the output. Output may not be unique, and third-party rights must still be respected. Do not describe the project art as wholly human-generated, automatically public-domain or licensed for redistribution. A public source/art license requires a separate owner decision under [release issue #15](https://github.com/AlexandroLeao/ami-108/issues/15). Do not change any approved art or manifest to document provenance.

## Current art authorization

CENA-01–07 and CENA-08/11/12 are reached in Chapters 1–4; CENA-09/10 are now reached in Chapter 5: CENA-09 on the gated boar reveal and CENA-10 in orbit. All 12 HTTP hashes passed. All twelve original PNGs and manifest retained. Chapter 4 memory art uses coded CRT opening, continuous subtle interference and shake on the child/lizard images, and disoriented eyelids on the betrayal image. Dog/rat reveal gradually with existing tremor; only specified scenes gate forward navigation. No new or duplicated artwork. Reduced motion supported.

> **Archived PR #38 snapshot:** [historical evidence](history-pr38-snapshot.md). For the latest verified seven-session pause and outstanding release gates, see [release readiness](release-readiness-matrix.md).

---


AMI-003 — approved art pipeline and isolated development preview.

The private official backup contains 12 approved scene images and 9 internal reference sheets. Only the 12 approved game scenes are inputs to this script; the reference sheets and original backup remain in Drive. Preserve the originals. No new art is generated.

## Prepare the images

Download the retained private asset backup ZIP v1.9 (the **historical November 17** private documents were v1.12/v1.10; **current** canonical sources are Master v1.14 / Script v1.12 plus accepted amendments; the art ZIP intentionally remains v1.9) and upload it to your Cloud Shell home directory, outside the repository. From the repo root:

```bash
uv run --script scripts/prepare-assets.py "$HOME/AMI-108-Backup-v1.9.zip"
```

The script uses Pillow 12.3.0, accepts only the exact approved scene filenames, converts to the three official colors without adding dithering, retains the original dimensions, and writes 12 indexed PNGs and a SHA-256 manifest to `apps/api/assets/scenes/`. It verifies palette, dimensions and file identities before publishing staged outputs. It does not extract or copy private documents or character sheets. Do not commit the source ZIP. Review all derived images for continuity and approve only the prepared game assets for the private repository.

## Historical isolated local asset preview (PR #18; current root is the five-chapter campaign)

```bash
test -f .env || cp .env.example .env
docker compose --parallel 1 up --build -d --wait
curl -fsS http://localhost:3001/development/scene -o /tmp/ami-opening.png
```

Open `/preview` on port 3000 for the isolated visual fixture. Historically, the local root opened the persisted Chapters 1–2 campaign (the current root runs all five accepted chapters) (merged PRs #20/#22), which uses the same visual direction. Choose Language, New game, then verify the cinematic chapter card, first three beats fully dark, one brief text tremor per waking beat, a single blink and blur-to-focus overlay on Where am I only, identical unfiltered art before/after stabilization, full stabilization at Blood (same mounted CENA-01), and the six approved opening dialogue steps; the chapter waits for manual advance with a dimmed, visible arrow that smoothly enables after the reveal. Test Extras, pause/resume, previous/next dialogue and keyboard controls. The chapter uses the same scene and dialogue frame; no layout jump. These opening checks describe the isolated fixture, not the persisted root. Continue game remains disabled in `/preview`; root enables it only for a server-confirmed session. For root, verify all 77 Chapter 1 beats and the complete Chapter 2, fixed-height energy-only header, dark transitions, both dialogue palettes and current-asset authorization. See [UI design](ui-design.md) and [development](development.md). The 12 derived PNGs and manifest are already committed; asset preparation is only needed if an approved original changes.

Preview flags are enabled only in local Compose. The isolated development route serves CENA-01 exclusively. The game has a session-authorized current-scene route for the full approved twelve-scene campaign; it requires the current key and refuses stale/future keys. Unreached assets stay server-only. Production must not set AMI_DEV_PREVIEW.

## Validation and boundaries

- Actual backup inspected: all 12 sources are 1536 × 864 (16:9); originals are not necessarily three-color PNGs.
- Local preparation against the v1.9 ZIP produced all 12 indexed PNGs with the exact three colors; the generated manifest records source/output hashes. Inspect derived images before commit.
- Source files and 9 character sheets stay out of the repository; prepared art must not be copied into Next.js public assets.
- UI preview implements menu, locale switch, chapter card, opening dialogue and reusable scene/dialogue/choice/energy components. The owner approved adding a silent ellipsis before splitting A01-S01/L01 into two cinematic beats; L02–L04 remain verbatim in both languages. No gameplay state, choice outcomes, inference, checkpoint logic or persistence is simulated.
- Run CI, inspect browser preview with prepared art, and test missing/unauthorized asset requests before accepting AMI-003. Session-based asset gates were verified by PR #20 API integration and built HTTP smoke tests. Full accessibility/performance and independent browser checks remain AMI-010.

## Cloud Shell disk-space safety

If an artwork or application build encounters insufficient disk space, **inspect without deleting**: `df -h / /home`, `df -i /` and `docker system df`. Image layers, installed Cloud Shell tools, model storage and database volumes are **not disposable merely because they occupy space**. The earlier generic image-rebuild/cache-prune advice was superseded and is preserved in [development history](development-history.md) as a **do-not-run historical note**. Follow the [safe pause/resume guide](cloud-shell-pause-resume.md) for a reviewed, environment-specific decision. Do not delete PostgreSQL volumes, private archives, original assets or `.env`.

PR #22 authorizes CENA-04 and CENA-05 only at current Chapter 2 views. The original twelve PNGs and manifest are unchanged; future assets remain inaccessible. The encounter layout and visual transitions were approved by the owner in PT-BR, EN and mobile. PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes). All 12 PNGs and manifest are identical to the prior baseline; built smoke validates their hashes and all five reached HTTP assets. Independent browser/accessibility checks remain AMI-010.
