#!/usr/bin/env python3
"""Editorial and reference-surface guards for AMI-108 documentation.

Not a Markdown parser, link crawler, security scan or semantic fact verifier.
Complement check-doc-links.py, check-doc-structure.py and human PR review.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")
HEADING = re.compile(r"^ {0,3}(#{1,6})[ \t]+(\S.*)$")
CONFLICT = re.compile(r"^(<<<<<<< |=======\s*$|>>>>>>> )")
ARCHIVE = re.compile(r"pause-ami108-\d{8}T\d{6}Z-\d+\.dump")
ACTIVE = {
    "README.md",
    "AGENTS.md",
    "docs/README.md",
    "docs/development.md",
    "docs/cloud-shell-pause-resume.md",
    "docs/production-plan.md",
    "docs/final-qa-acceptance-worksheet.md",
    "docs/accessibility-performance-qa.md",
    "docs/zero-mandatory-cost-hosting-assessment.md",
    "docs/architecture/decisions.md",
}
SINGLE_CHECKPOINT_FILES = ACTIVE - {"docs/architecture/decisions.md"}
SOURCE_OF_TRUTH = "docs/release-readiness-matrix.md"


def markdown_errors(path: str, content: str) -> list[str]:
    """Surface mistakes that existing one-H1/fence checks do not cover."""
    issues: list[str] = []
    in_fence = False
    mark = ""
    n = 0
    previous_level = 0
    for number, line in enumerate(content.splitlines(), 1):
        fence = FENCE.match(line)
        if fence:
            sequence = fence.group(1)
            if not in_fence:
                in_fence, mark, n = True, sequence[0], len(sequence)
                # Active code samples should be labeled for maintainers.
                if path in ACTIVE and not fence.group(2).strip():
                    issues.append(f"{path}:{number}: unlabeled code fence")
            elif sequence[0] == mark and len(sequence) >= n:
                in_fence = False
            continue
        if in_fence:
            continue
        if CONFLICT.match(line):
            issues.append(f"{path}:{number}: unresolved merge-conflict marker")
        heading = HEADING.match(line)
        if heading:
            level = len(heading.group(1))
            if previous_level and level > previous_level + 1:
                issues.append(f"{path}:{number}: heading skips H{previous_level} to H{level}")
            previous_level = level
    if path in SINGLE_CHECKPOINT_FILES and ARCHIVE.search(content):
        issues.append(f"{path}: do not duplicate live backup filenames; link to {SOURCE_OF_TRUTH}")
    return issues


def long_paragraphs(content: str) -> set[str]:
    """Report exact repeated long prose in active ownership documents only."""
    prose: list[str] = []
    chunks: list[str] = []
    in_fence = False
    mark = ""
    n = 0
    for line in content.splitlines() + [""]:
        fence = FENCE.match(line)
        if fence:
            sequence = fence.group(1)
            if not in_fence:
                in_fence, mark, n = True, sequence[0], len(sequence)
            elif sequence[0] == mark and len(sequence) >= n:
                in_fence = False
            if prose:
                chunks.append(" ".join(prose))
                prose = []
            continue
        if in_fence or not line.strip() or line.startswith(("#", ">", "|", "-", "*", "1.", "2.", "3.")):
            if prose:
                chunks.append(" ".join(prose))
                prose = []
            continue
        prose.append(line.strip())
    return {re.sub(r"\s+", " ", p).strip() for p in chunks if len(p) >= 360}


def duplicate_paragraph_errors(documents: dict[str, str]) -> list[str]:
    owners: dict[str, set[str]] = {}
    for path, content in documents.items():
        if path not in ACTIVE:
            continue
        for paragraph in long_paragraphs(content):
            owners.setdefault(paragraph, set()).add(path)
    return [
        f"duplicated long prose across active docs: {', '.join(sorted(paths))}"
        for paths in owners.values()
        if len(paths) > 1
    ]


def adr_errors(content: str) -> list[str]:
    ids = re.findall(r"^## ADR-(\d{3})\b", content, re.M)
    problems: list[str] = []
    if ids != [f"{i:03d}" for i in range(1, 9)]:
        problems.append("ADR identifiers must be unique and ordered 001 through 008")
    sections = re.split(r"(?=^## ADR-\d{3}\b)", content, flags=re.M)
    for section in sections[1:]:
        match = re.match(r"## ADR-(\d{3})", section)
        if not match:
            continue
        for label in ("Status", "Context", "Decision", "Alternatives considered", "Consequences"):
            if f"**{label}:**" not in section:
                problems.append(f"ADR-{match.group(1)} missing {label}")
    return problems


def openapi_errors(path: str, content: str) -> list[str]:
    try:
        doc = json.loads(content)
    except json.JSONDecodeError as exc:
        return [f"{path}: invalid JSON: {exc}"]
    issues = []
    if doc.get("openapi") != "3.1.0" or not isinstance(doc.get("paths"), dict):
        issues.append(f"{path}: expected OpenAPI 3.1.0 paths")
    seen: set[str] = set()
    for route, entry in doc.get("paths", {}).items():
        if not isinstance(entry, dict):
            issues.append(f"{path}: invalid path object: {route}")
            continue
        for method, operation in entry.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "head", "options"}:
                continue
            op_id = operation.get("operationId") if isinstance(operation, dict) else None
            if not op_id or op_id in seen:
                issues.append(f"{path}: missing or duplicate operationId on {method.upper()} {route}")
            else:
                seen.add(op_id)
            if not (operation.get("summary") or operation.get("description")):
                issues.append(f"{path}: operation missing summary/description on {method.upper()} {route}")
            if not operation.get("responses"):
                issues.append(f"{path}: operation missing responses on {method.upper()} {route}")
    return issues


def main() -> int:
    paths = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-files", "-z", "--", "*.md"]
    ).split(b"\0")
    documents: dict[str, str] = {}
    for raw in paths:
        if not raw:
            continue
        rel = raw.decode("utf-8")
        file = ROOT / rel
        if file.is_file():
            documents[rel] = file.read_text(encoding="utf-8")
    errors: list[str] = []
    for path, content in documents.items():
        errors.extend(markdown_errors(path, content))
    errors.extend(duplicate_paragraph_errors(documents))
    if SOURCE_OF_TRUTH not in documents:
        errors.append("missing authoritative release-readiness document")
    if "docs/documentation-standards.md" not in documents:
        errors.append("missing documentation maintenance policy")
    if "docs/README.md" in documents and "documentation-standards.md" not in documents["docs/README.md"]:
        errors.append("documentation index does not link the maintenance policy")
    if "docs/architecture/decisions.md" in documents:
        errors.extend(adr_errors(documents["docs/architecture/decisions.md"]))
    for name in ("game.openapi.json", "ai.openapi.json"):
        path = f"docs/api/{name}"
        file = ROOT / path
        if not file.is_file():
            errors.append(f"missing contract {path}")
        else:
            errors.extend(openapi_errors(path, file.read_text(encoding="utf-8")))
    for error in errors:
        print("DOC_EDITORIAL:", error)
    print(f"Editorial documentation check: {len(documents)} Markdown files, 2 OpenAPI files, {len(errors)} issue(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
