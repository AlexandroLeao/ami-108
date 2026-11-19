#!/usr/bin/env python3
"""Fail CI for broken relative Markdown links in the tracked project documentation.

Checks link destinations without following external URLs or accessing private sources.
Non-mutating and intentionally independent of third-party Markdown packages.
"""
from __future__ import annotations
import argparse
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

LINK = re.compile(r"\[[^\]]*\]\((<?[^\s)]+>?)")
FENCE = re.compile(r"^\s*(\x60{3,}|~{3,})")
EXTERNAL = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*:")


def invalid_links(root: Path, doc: Path) -> list[str]:
    problems = []
    in_fence = False
    fence_char = ""
    fence_len = 0
    for number, line in enumerate(doc.read_text(encoding="utf-8").splitlines(), 1):
        match = FENCE.match(line)
        if match:
            mark = match.group(1)
            if not in_fence:
                in_fence, fence_char, fence_len = True, mark[0], len(mark)
            elif mark[0] == fence_char and len(mark) >= fence_len:
                in_fence = False
            continue
        if in_fence:
            continue
        for link in LINK.finditer(line):
            target = link.group(1).strip("<>")
            if not target or target.startswith(("#", "//")) or EXTERNAL.match(target):
                continue
            path_part = unquote(urlsplit(target).path)
            if not path_part:
                continue
            dest = (root / path_part.lstrip("/")) if path_part.startswith("/") else (doc.parent / path_part)
            if not dest.exists():
                problems.append(f"{doc.relative_to(root)}:{number}: {target}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    opts = parser.parse_args()
    root = opts.root.resolve()
    tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z", "--", "*.md"])
    documents = [root / rel.decode("utf-8") for rel in tracked.split(bytes([0])) if rel]
    documents = [p for p in documents if p.is_file()]
    missing = [problem for doc in documents for problem in invalid_links(root, doc)]
    for problem in missing:
        print("BROKEN_LOCAL_LINK:", problem)
    print(f"Documentation link audit: {len(documents)} files, {len(missing)} broken local paths")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
