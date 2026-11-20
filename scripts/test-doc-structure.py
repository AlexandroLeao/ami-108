#!/usr/bin/env python3
"""Disposable fixtures for Markdown H1 and code-fence boundaries."""
import runpy
import tempfile
from pathlib import Path

problems = runpy.run_path(str(Path(__file__).with_name("check-doc-structure.py")))["problems"]

with tempfile.TemporaryDirectory(prefix="ami-md-") as td:
    root = Path(td)
    readme = root / "README.md"
    readme.write_text("# First\n\n## Heading\n```bash\n# shown as source\n```\n")
    assert problems(readme, root) == [], problems(readme, root)
    readme.write_text("# First\nLiteral " + chr(92) + "n" + chr(92) + "n escaped paragraph break\n")
    assert any("literal escaped paragraph" in s for s in problems(readme, root))
    readme.write_text("# First\n# Second merged document\n")
    assert any("found 2" in s for s in problems(readme, root))
    readme.write_text("# First\n\n```bash\n## code still open\n")
    assert any("unclosed fenced" in s for s in problems(readme, root))
    template = root / ".github" / "pull_request_template.md"
    template.parent.mkdir()
    template.write_text("## Description\n")
    assert problems(template, root) == []
print("Markdown boundary fixture tests passed")
