#!/usr/bin/env python3
"""Reject obvious private file classes from the tracked Git tree.

This is a filename-only CI guard; it is not content-based secret detection.
It does not open, scan, upload, delete or alter private files.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import PurePosixPath

SENSITIVE_SUFFIXES = (".dump", ".dump.sha256", ".sqlite", ".sqlite3", ".db", ".pem", ".p12", ".pfx", ".key", ".jks", ".keystore")
SOURCE_NAMES = re.compile(r"(documento[-_ ]mestre|roteiro[-_ ]interativo)", re.I)
BLOCKED_PARTS = {"node_modules", ".venv", ".next", "__pycache__", ".terraform"}


def reason(path: str) -> str | None:
    parts = PurePosixPath(path).parts
    name = parts[-1].lower() if parts else ""
    if any(p in BLOCKED_PARTS for p in parts):
        return "build or dependency artifact"
    if name == ".env" or (name.startswith(".env.") and name not in {".env.example", ".env.sample"}):
        return "private environment configuration"
    if name.endswith(SENSITIVE_SUFFIXES):
        return "private key, database or backup extension"
    if SOURCE_NAMES.search(name):
        return "private canonical narrative source filename"
    if name.endswith((".zip", ".7z", ".rar")):
        return "unreviewed archive (may include original/private assets)"
    if name in {"service-account.json", "credentials.json", "secrets.json", "id_rsa", "id_ed25519"}:
        return "likely credentials"
    return None


def main() -> int:
    tracked = subprocess.check_output(["git", "ls-files", "-z"])
    files = [p.decode("utf-8") for p in tracked.split(bytes([0])) if p]
    errors = [(p, reason(p)) for p in files if reason(p)]
    for path, why in errors:
        print(f"TRACKED_PRIVATE_FILE: {path} ({why})")
    print(f"Tracked-file hygiene: {len(files)} paths, {len(errors)} blocked names")
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())
