#!/usr/bin/env python3
"""Validate basic Markdown boundaries across tracked project documentation.

This catches accidentally concatenated standalone documents (multiple H1s)
and unclosed fenced code blocks. It is NOT an editorial, HTML or PDF validator.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(?:[^\r\n]*)$")
H1 = re.compile(r"^# [^#\s].*$")
HEADERLESS = {".github/pull_request_template.md"}


def problems(path: Path, root: Path) -> list[str]:
    rel = path.relative_to(root).as_posix()
    count = 0
    opening = 0
    marker = ""
    length = 0
    errors = []
    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        match = FENCE.match(line)
        if match:
            sequence = match.group(1)
            if not marker:
                marker, length, opening = sequence[0], len(sequence), lineno
            elif sequence[0] == marker and len(sequence) >= length:
                marker, length, opening = "", 0, 0
            continue
        if not marker and H1.match(line):
            count += 1
    expected = 0 if rel in HEADERLESS else 1
    if count != expected:
        errors.append(f"{rel}: expected {expected} top-level headings, found {count}")
    if marker:
        errors.append(f"{rel}:{opening}: unclosed fenced code block")
    return errors


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    tracked = subprocess.check_output(
        ["git", "-C", str(root), "ls-files", "-z", "--", "*.md"]
    )
    docs = [root / raw.decode("utf-8") for raw in tracked.split(bytes([0])) if raw]
    docs = [doc for doc in docs if doc.is_file()]
    errors = [item for doc in docs for item in problems(doc, root)]
    for issue in errors:
        print("MARKDOWN_STRUCTURE:", issue)
    print(f"Markdown boundary audit: {len(docs)} tracked documents, {len(errors)} structural issues")
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())
