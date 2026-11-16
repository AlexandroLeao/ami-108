# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow==12.3.0"]
# ///
"""Prepare the 12 approved scene images from a private AMI-108 backup ZIP."""

import argparse
import hashlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from PIL import Image

COLORS = ((23, 23, 23), (253, 243, 233), (252, 39, 33))
SOURCE_PREFIX = "projeto-autoral-iv-artes-v1.6/cenas/"
SCENES = (
    "cena-01-deposito.jpg",
    "cena-02-rua.jpg",
    "cena-03-encontro-ami.jpg",
    "cena-04-cao.jpg",
    "cena-05-terminal.jpg",
    "cena-06-laboratorio.jpg",
    "cena-07-rato.jpg",
    "cena-08-ami-crianca.jpg",
    "cena-09-hangar-javali.jpg",
    "cena-10-final-nave.jpg",
    "cena-11-howard-traicao.jpg",
    "cena-12-ami-protege-crianca.jpg",
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def prepare(source: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    palette = Image.new("P", (1, 1))
    palette.putpalette([channel for i in range(256) for channel in COLORS[i % 3]])
    rows = []
    with ZipFile(source) as backup, TemporaryDirectory(dir=output.parent) as tmp:
        staging = Path(tmp)
        for number, filename in enumerate(SCENES, 1):
            member = SOURCE_PREFIX + filename
            if backup.namelist().count(member) != 1:
                raise ValueError(f"Missing or duplicate approved scene: {member}")
            raw = backup.read(member)
            scene_id = f"CENA-{number:02d}"
            with Image.open(io.BytesIO(raw)) as original:
                width, height = original.size
                if width * 9 != height * 16:
                    raise ValueError(f"Unexpected aspect ratio for {scene_id}: {original.size}")
                indexed = original.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
                indexed = indexed.point([i % 3 for i in range(256)])
                indexed.putpalette([channel for color in COLORS for channel in color])
                target = staging / f"{scene_id}.png"
                indexed.save(target, format="PNG", bits=2, optimize=True)
            with Image.open(target) as check:
                actual = {color for _, color in check.convert("RGB").getcolors(maxcolors=4) or []}
                if check.size != (width, height) or check.mode != "P" or actual != set(COLORS):
                    raise ValueError(f"Palette/dimensions validation failed for {scene_id}")
            rows.append({
                "id": scene_id,
                "file": target.name,
                "width": width,
                "height": height,
                "sourceSha256": sha256(raw),
                "sha256": sha256(target.read_bytes()),
            })
        manifest = {"palette": ["#171717", "#FDF3E9", "#FC2721"], "scenes": rows}
        (staging / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        for path in staging.iterdir():
            path.replace(output / path.name)
    print(f"Prepared and verified {len(rows)} indexed PNGs in {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup", type=Path, help="Private official backup ZIP")
    parser.add_argument("--output", type=Path, default=Path("apps/api/assets/scenes"))
    arguments = parser.parse_args()
    prepare(arguments.backup, arguments.output)
