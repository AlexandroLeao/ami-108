# Scene asset preparation

AMI-003 — approved art pipeline and isolated development preview.

The private official backup contains 12 approved scene images and 9 internal reference sheets. Only the 12 approved game scenes are inputs to this script; the reference sheets and original backup remain in Drive. Preserve the originals. No new art is generated.

## Prepare the images

Download the current private backup ZIP and upload it to your Cloud Shell home directory, outside the repository. From the repo root:

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

Open port 3000 and navigate to `/preview`. Choose Portuguese/English, New game, then Continue. Check the chapter card, opening image and four exact approved lines; verify the menu and keyboard controls. This is a visual fixture, not a persistent game or a completed narrative engine. Continue game remains disabled.

Preview flags are enabled only in local Compose. The API route serves CENA-01 exclusively; later assets remain server-only and no arbitrary scene ID can be requested. Production must not set AMI_DEV_PREVIEW. The authenticated current-step asset endpoint is part of the game engine implementation, not this development route.

## Validation and boundaries

- Actual backup inspected: all 12 sources are 1536 × 864 (16:9); originals are not necessarily three-color PNGs.
- Local preparation against the v1.9 ZIP produced all 12 indexed PNGs with the exact three colors; the generated manifest records source/output hashes. Inspect derived images before commit.
- Source files and 9 character sheets stay out of the repository; prepared art must not be copied into Next.js public assets.
- UI preview implements menu, locale switch, chapter card, opening dialogue and reusable scene/dialogue/choice/energy components. The initial four lines are canonical; no gameplay state, choice outcomes, inference, checkpoint logic or persistence is simulated.
- Run CI, inspect browser preview with prepared art, and test missing/unauthorized asset requests before accepting AMI-003. Accessibility/performance and actual session-based asset gates are verified with later implementation issues.
