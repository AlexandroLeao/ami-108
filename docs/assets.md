# Scene asset preparation

AMI-003 — approved art pipeline and isolated development preview.

The private official backup contains 12 approved scene images and 9 internal reference sheets. Only the 12 approved game scenes are inputs to this script; the reference sheets and original backup remain in Drive. Preserve the originals. No new art is generated.

## Prepare the images

Download the retained private asset backup ZIP v1.9 (the latest synchronized private documents are v1.12/v1.10; the ZIP intentionally remains v1.9) and upload it to your Cloud Shell home directory, outside the repository. From the repo root:

```bash
uv run --script scripts/prepare-assets.py "$HOME/AMI-108-Backup-v1.9.zip"
```

The script uses Pillow 12.3.0, accepts only the exact approved scene filenames, converts to the three official colors without adding dithering, retains the original dimensions, and writes 12 indexed PNGs and a SHA-256 manifest to `apps/api/assets/scenes/`. It verifies palette, dimensions and file identities before publishing staged outputs. It does not extract or copy private documents or character sheets. Do not commit the source ZIP. Review all derived images for continuity and approve only the prepared game assets for the private repository.

## Local integration preview

```bash
test -f .env || cp .env.example .env
docker compose --parallel 1 up --build -d --wait
curl -fsS http://localhost:3001/development/scene -o /tmp/ami-opening.png
```

Open `/preview` on port 3000 for the isolated visual fixture. The local root on `main` opens the owner-approved persisted Chapters 1–2 campaign (merged PRs #20/#22), which uses the same visual direction. Choose Language, New game, then verify the cinematic chapter card, first three beats fully dark, one brief text tremor per waking beat, a single blink and blur-to-focus overlay on Where am I only, identical unfiltered art before/after stabilization, full stabilization at Blood (same mounted CENA-01), and the six approved opening dialogue steps; the chapter waits for manual advance with a dimmed, visible arrow that smoothly enables after the reveal. Test Extras, pause/resume, previous/next dialogue and keyboard controls. The chapter uses the same scene and dialogue frame; no layout jump. These opening checks describe the isolated fixture, not the persisted root. Continue game remains disabled in `/preview`; root enables it only for a server-confirmed session. For root, verify all 77 Chapter 1 beats and the complete Chapter 2, fixed-height energy-only header, dark transitions, both dialogue palettes and current-asset authorization. See [UI design](ui-design.md) and [development](development.md). The 12 derived PNGs and manifest are already committed; asset preparation is only needed if an approved original changes.

Preview flags are enabled only in local Compose. The isolated development route serves CENA-01 exclusively. The local campaign has a separate session-authorized current-step route for CENA-01/02/03; it requires the current key and refuses stale/future keys. The remaining assets stay server-only. Production must not set AMI_DEV_PREVIEW.

## Validation and boundaries

- Actual backup inspected: all 12 sources are 1536 × 864 (16:9); originals are not necessarily three-color PNGs.
- Local preparation against the v1.9 ZIP produced all 12 indexed PNGs with the exact three colors; the generated manifest records source/output hashes. Inspect derived images before commit.
- Source files and 9 character sheets stay out of the repository; prepared art must not be copied into Next.js public assets.
- UI preview implements menu, locale switch, chapter card, opening dialogue and reusable scene/dialogue/choice/energy components. The owner approved adding a silent ellipsis before splitting A01-S01/L01 into two cinematic beats; L02–L04 remain verbatim in both languages. No gameplay state, choice outcomes, inference, checkpoint logic or persistence is simulated.
- Run CI, inspect browser preview with prepared art, and test missing/unauthorized asset requests before accepting AMI-003. Session-based asset gates were verified by PR #20 API integration and built HTTP smoke tests. Full accessibility/performance and independent browser checks remain AMI-010.

## Cloud Shell disk-space recovery

If Compose fails during a build with `No space left on device`, inspect `df -h /`, `df -i /` and `docker system df`. The Node Dockerfile installs and builds as the unprivileged node user; it no longer recursively changes ownership of the whole dependency tree. To reclaim space, stop this project with `docker compose down --rmi local` (retains PostgreSQL volumes), then run `docker builder prune -a` only if you can discard unused build caches, including those from other projects. Confirm the prompt, check free space and rebuild sequentially with `docker compose --parallel 1 up --build -d --wait`. Never add `--volumes` or `-v` to recovery commands. The corrective Dockerfile requires a fresh integrated runtime check; application CI alone does not verify container builds.

PR #22 authorizes CENA-04 and CENA-05 only at current Chapter 2 views. The original twelve PNGs and manifest are unchanged; future assets remain inaccessible. The encounter layout and visual transitions were approved by the owner in PT-BR, EN and mobile. PR #22 merged at `76946f9` on November 17, 2026 after owner approval of PT-BR, EN and mobile playtests. Final [branch CI 44122437473](https://github.com/AlexandroLeao/ami-108/actions/runs/44122437473) and [post-merge CI 44124197244](https://github.com/AlexandroLeao/ami-108/actions/runs/44124197244) passed (46 API, 17 web, 1 Python tests; three migrations, lint/type checks, builds and built HTTP smoke including original artwork hashes). All 12 PNGs and manifest are identical to the prior baseline; built smoke validates their hashes and all five reached HTTP assets. Independent browser/accessibility checks remain AMI-010.
