#!/usr/bin/env python3
"""Unit coverage for the Markdown local-path audit."""
import runpy
import tempfile
from pathlib import Path

invalid_links = runpy.run_path(str(Path(__file__).with_name("check-doc-links.py")))["invalid_links"]

with tempfile.TemporaryDirectory(prefix="ami-doclinks-") as tmp:
    root = Path(tmp)
    (root / "docs").mkdir()
    (root / "README.md").write_text("# Project\n")
    (root / "docs" / "sample.md").write_text(
        "# Links\n"
        "[valid](../README.md#header)\n"
        "![image](../README.md)\n"
        "[external](https://example.org/page)\n"
        "[anchor](#title)\n"
        "```bash\n"
        "[sample code](missing-inside-fence.md)\n"
        "```\n"
        "[broken](missing-file.md)\n"
        "[broken image](../missing-image.png)\n",
        encoding="utf-8",
    )
    bad = invalid_links(root, root / "docs" / "sample.md")
    assert len(bad) == 2, bad
    assert "missing-file.md" in bad[0], bad
    assert "missing-image.png" in bad[1], bad
    (root / "docs" / "missing-file.md").touch()
    (root / "missing-image.png").touch()
    assert invalid_links(root, root / "docs" / "sample.md") == []
print("Docs link check fixtures passed")
