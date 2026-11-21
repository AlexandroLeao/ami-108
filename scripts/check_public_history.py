#!/usr/bin/env python3
"""Conservative, offline pre-publication scan of reachable Git history.

No credential verification and no network calls. Never print matched values.
A clean result is NOT a comprehensive secret-scanning/rights certificate.
"""
from __future__ import annotations

import re
import subprocess
import sys

MAX_BLOB_BYTES = 2_000_000
MAX_REPORTED = 30

# A single *old test blob* accidentally committed a concrete-looking,
# completely synthetic DB URL. The exact object is pinned; new/changed blobs
# and other detector classes are NEVER suppressed.
HISTORICAL_DUMMY_DB_TEST_BLOB = "8c015129bd35c287dbf62632daaa7d00a5527482"

TOKEN_PATTERNS: dict[str, re.Pattern[bytes]] = {
    "groq-key": re.compile(rb"\bgsk_[A-Za-z0-9]{25,}\b"),
    "openai-key": re.compile(rb"\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b"),
    "github-token": re.compile(rb"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{35,}\b"),
    "github-fine-grained-pat": re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{25,}\b"),
    "aws-access-id": re.compile(rb"\bAKIA[A-Z0-9]{16}\b"),
    "private-key-block": re.compile(rb"-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----"),
    "stripe-live-secret": re.compile(rb"\bsk_live_[A-Za-z0-9]{20,}\b"),
}
DATABASE_URL = re.compile(
    rb"\b(?:postgres(?:ql)?|mysql|redis)://([^\s/@?#]+)@([A-Za-z0-9._-]+)",
    re.IGNORECASE,
)


def scan_text(payload: bytes) -> set[str]:
    """Only report detector classes. Does not expose the matched secret."""
    if b"\x00" in payload[:8192]:
        return set()
    findings = {name for name, pattern in TOKEN_PATTERNS.items() if pattern.search(payload)}
    for match in DATABASE_URL.finditer(payload):
        credentials, hostname = match.groups()
        host = hostname.lower()
        if host in (b"localhost", b"127.0.0.1", b"0.0.0.0", b"db", b"postgres") or host.endswith((b".local", b".internal", b".example")):
            continue
        if b":" not in credentials:
            continue
        password = credentials.split(b":", 1)[1]
        if not password or any(marker in password.lower() for marker in (
            b"$", b"<", b">", b"example", b"dummy", b"password", b"changeme", b"test", b"placeholder"
        )):
            continue
        findings.add("database-credential-url")
    return findings


def git(*args: str, input_data: bytes | None = None) -> bytes:
    result = subprocess.run(
        ["git", *args], input=input_data, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, check=False,
    )
    if result.returncode:
        raise RuntimeError("Git history inspection failed; refusing publication clearance")
    return result.stdout


def scan_reachable_history() -> int:
    if git("rev-parse", "--is-shallow-repository").strip() != b"false":
        raise RuntimeError("Shallow Git checkout: fetch the full reachable history first")
    objects: dict[str, str] = {}
    for entry in git("rev-list", "--objects", "--all").decode("utf-8", errors="replace").splitlines():
        sha, _, path = entry.partition(" ")
        objects.setdefault(sha, path or "(historic object)")
    if not objects:
        raise RuntimeError("No reachable Git objects: no history was inspected")
    shas = list(objects)
    metadata = git(
        "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)",
        input_data=("\n".join(shas) + "\n").encode(),
    ).decode("ascii").splitlines()
    blobs: list[str] = []
    skipped_large = 0
    for line in metadata:
        parts = line.split()
        if len(parts) != 3 or parts[1] != "blob":
            continue
        size = int(parts[2])
        if size > MAX_BLOB_BYTES:
            skipped_large += 1
        else:
            blobs.append(parts[0])

    findings: list[tuple[str, str]] = []
    with subprocess.Popen(
        ["git", "cat-file", "--batch"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    ) as proc:
        assert proc.stdin and proc.stdout
        for sha in blobs:
            proc.stdin.write((sha + "\n").encode("ascii"))
            proc.stdin.flush()
            header = proc.stdout.readline().strip().split()
            if len(header) != 3 or header[0].decode() != sha or header[1] != b"blob":
                raise RuntimeError("Git batch object/header mismatch")
            payload = proc.stdout.read(int(header[2]))
            if len(payload) != int(header[2]) or proc.stdout.read(1) != b"\n":
                raise RuntimeError("Truncated Git blob inspection")
            for issue in sorted(scan_text(payload)):
                path = objects.get(sha, "(historic object)")
                if (sha == HISTORICAL_DUMMY_DB_TEST_BLOB
                        and path == "scripts/test_public_history.py"
                        and issue == "database-credential-url"):
                    continue  # Explicit historical test-only synthetic fixture.
                findings.append((path, issue))
        proc.stdin.close()
        if proc.wait() != 0:
            raise RuntimeError("Git batch inspection failed")

    print(
        f"History scan: {len(blobs)} text-sized reachable blobs inspected; "
        f"{skipped_large} oversized blobs omitted; {len(findings)} potential finding(s)."
    )
    if findings:
        print("Potential secrets (file/object names and detector category ONLY):", file=sys.stderr)
        for path, issue in findings[:MAX_REPORTED]:
            print(f"  {path[:160]}: {issue}", file=sys.stderr)
        if len(findings) > MAX_REPORTED:
            print("  Additional findings omitted; investigate privately.", file=sys.stderr)
        return 1
    print("No match to the conservative offline patterns. Manual review still required.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(scan_reachable_history())
    except (RuntimeError, OSError, ValueError) as exc:
        # Do not print subprocess stderr (it might include credentials).
        print(f"History audit incomplete: {type(exc).__name__}. Do not publish.", file=sys.stderr)
        sys.exit(2)
