#!/usr/bin/env python3
"""Isolated fixtures for documentation editorial guards; no external services."""
from __future__ import annotations

import runpy
from pathlib import Path

helpers = runpy.run_path(str(Path(__file__).with_name("check-doc-editorial.py")))
check_md = helpers["markdown_errors"]
dup = helpers["duplicate_paragraph_errors"]
adr = helpers["adr_errors"]
openapi = helpers["openapi_errors"]

assert check_md("docs/development.md", "# Test\n\n## Good\n\n```bash\necho safe\n```\n") == []
assert any("heading skips" in x for x in check_md("docs/development.md", "# Test\n\n### Skipped\n"))
assert any("merge-conflict" in x for x in check_md("docs/a.md", "# T\n<<<<<<< HEAD\n"))
assert any("unlabeled code fence" in x for x in check_md("docs/development.md", "# T\n```\ncode\n```\n"))
assert any("backup filenames" in x for x in check_md(
    "README.md", "# T\npause-ami108-20261120T155634Z-1926.dump\n"
))
assert check_md(
    "docs/release-readiness-matrix.md", "# T\npause-ami108-20261120T155634Z-1926.dump\n"
) == []

paragraph = "Durable engineering evidence requires a verified source, a dated context, distinct approval boundaries and a clearly identified owner. " * 4
assert len(dup({"README.md": "# A\n\n" + paragraph, "AGENTS.md": "# B\n\n" + paragraph})) == 1
assert dup({"README.md": "# A\n\n" + paragraph, "docs/development-history.md": paragraph}) == []

valid_adr = "# ADRs\n\n" + "".join(
    f"## ADR-{i:03d} — Decision\n\n" +
    "**Status:** Accepted\n\n**Context:** C\n\n**Decision:** D\n\n" +
    "**Alternatives considered:** A\n\n**Consequences:** C\n\n"
    for i in range(1, 9)
)
assert adr(valid_adr) == []
assert adr(valid_adr + "## ADR-009 — Future accepted decision\n\n**Status:** Accepted\n\n**Context:** C\n\n**Decision:** D\n\n**Alternatives considered:** A\n\n**Consequences:** C\n\n") == []
assert any("ordered" in x for x in adr(valid_adr.replace("ADR-004", "ADR-009")))
assert any("missing Context" in x for x in adr(valid_adr.replace("**Context:** C\n\n", "", 1)))
valid_openapi = '{"openapi":"3.1.0","paths":{"/x":{"get":{"operationId":"x","summary":"x","responses":{"200":{"description":"ok"}}}}}}'
assert openapi("docs/api/test.openapi.json", valid_openapi) == []
assert any("invalid operation object" in x for x in openapi(
    "docs/api/test.openapi.json",
    '{"openapi":"3.1.0","paths":{"/x":{"get":"not-an-operation"}}}'
))
assert openapi("docs/api/test.openapi.json", '{"paths":') != []
assert any("duplicate operationId" in x for x in openapi(
    "docs/api/test.openapi.json",
    '{"openapi":"3.1.0","paths":{"/x":{"get":{"operationId":"dup","summary":"x","responses":{"200":{}}}},"/y":{"get":{"operationId":"dup","summary":"y","responses":{"200":{}}}}}}'
))

print("Documentation editorial fixture tests passed")
