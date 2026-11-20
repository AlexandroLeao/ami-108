#!/usr/bin/env python3
"""Filename-only privacy guard fixture checks."""
import runpy
from pathlib import Path

reason = runpy.run_path(str(Path(__file__).with_name("check-tracked-private-files.py")))["reason"]
allowed = ["README.md", "apps/api/.env.example", "scripts/check-tracked-private-files.py",
           "apps/web/public/images/scene.png", "docs/architecture/system-design.md"]
blocked = [".env", "apps/api/.env.production", "backup.dump", "backup.dump.sha256",
           "keys/private.pem", "credentials.json", "assets-raw.zip",
           "AMI-108-Documento-Mestre-v1.14.pdf", "AMI-108-Roteiro-Interativo-v1.12.md",
           "apps/web/.next/server.js", "apps/api/node_modules/lib.js"]
assert all(reason(p) is None for p in allowed), [p for p in allowed if reason(p)]
assert all(reason(p) is not None for p in blocked), [p for p in blocked if not reason(p)]
print("Tracked private filename hygiene fixtures passed")
