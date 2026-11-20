# Development — AMI-108

> **Status: current development reference (November 20, 2026).** The archived milestone log is [development-history.md](development-history.md). Do not execute commands from that historical log against live saves. For authoritative acceptance status, see [release readiness](release-readiness-matrix.md).

## Accepted runtime and current operating boundary

The accepted local gameplay revision is `14ea583a83c7c1473bc94f3b1d515a8497827ac3`, with five chapters, PT-BR/EN, authoritative PostgreSQL saves and optional local inference with authored fallback. The owner confirmed Continue after the replacement-VM recovery and subsequently completed a safe pause. **No application service is currently running.** The prior VM's real-Qwen evaluation remains historical; the replacement VM used `AMI_AI_GENERATION=0` and had no Ollama.

For the **latest verified archive, counts, disk limits and release issues**, consult [release readiness](release-readiness-matrix.md) instead of maintaining a second snapshot here. For recovery or another pause, use the [reviewed operational runbook](cloud-shell-pause-resume.md); do not fast-forward the frozen game to GitHub documentation-only `main` by default.

## Prerequisites and local boundaries

Development requires Docker Engine with Compose CLI plugin, Node.js 22 (>=22.12), pnpm 10.15.1 through Corepack, Python 3.12 and uv. The accepted manual environment is Google Cloud Shell; Codespaces is an unverified optional alternative. Cloud Shell Docker VMs and volumes may be replaced between sessions; the user's private `$HOME` backup is a separate preservation requirement.

The local `compose.yaml` uses `AMI_DEV_PREVIEW=1`, exposes only loopback ports **3000** (Web), **3001** (API) and **8000** (AI health/authorized interface), with PostgreSQL internal to Docker. The original Ollama model must remain on an internal-only Docker network **without host-published port**. Public hosting requires additional authorization, trusted TLS/origin, ingress controls and security review. A container's `healthy` state is not proof of model inference.

Copy `.env.example` to `.env` **only when provisioning a genuinely new, disposable environment**. Never replace the existing private `.env`, share it, add it to Git, or commit dumps or cookies. Use a local URL-safe PostgreSQL password (or encode it appropriately for `DATABASE_URL`), independent secure internal token, and no paid/cloud model provider.

## Inspect a resumed environment

**Read-only checks come first.** Before any recovery, image build, migration, game action or model pull, follow the [Cloud Shell runbook](cloud-shell-pause-resume.md). If the Docker database volume survived, never restore into it. Use the [historical developer record](development-history.md) only for provenance, **not** as a replacement for the reviewed current preflight.

In a separately approved, healthy private preview, the read-only status endpoints are:

```bash
docker compose ps
curl --fail --silent --show-error http://127.0.0.1:3000/health
curl --fail --silent --show-error http://127.0.0.1:3001/health/ready
curl --fail --silent --show-error http://127.0.0.1:8000/health
```

Do not run the above against stopped services to “prove” availability. The HTTP endpoints prove **only service readiness**, not local Qwen inference, saved-session integrity, UI accessibility or public capacity. Continue should be retested only when a future recovery plan actually requires it; preserve the owner's original cookies and browser origin.

## Code structure and verification

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js and browser-facing game interface |
| `apps/api` | NestJS, Prisma, authoritative state, permissions and recovery |
| `services/ai` | FastAPI, finite authorized text and optional local model |
| `apps/api/prisma` | Four accepted additive database migrations and schema |
| `docs/` | [Requirements](architecture/requirements.md), [system design](architecture/system-design.md), [game domain](architecture/domain-model.md), [API contracts](api/README.md), [accessibility plan](accessibility-performance-qa.md) |
| `scripts/` | Verification, image preparation and guarded local recovery tooling |

Normal source verification in an **isolated development/test checkout**, not a live restore session:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
(cd services/ai && uv run --locked ruff check . && uv run --locked mypy app tests && uv run --locked pytest)
python3 scripts/check-doc-links.py
```

CI separately uses disposable PostgreSQL, validates/applies the four migrations, runs the TypeScript and Python suites and full built campaign HTTP smoke with all twelve original scene-art hashes. The accepted PR #53 test baseline was **105 API, 44 Web and 72 Python = 221 tests**; later operational/documentation tests are additional checks, not a reason to infer production readiness.

## Document precedence

The last synchronized private source files are **Documento Mestre v1.14** and **Roteiro Interativo v1.12**, but their Day 3 front matter predates the approved Chapter 5. They are **not a fully up-to-date standalone five-chapter document**; explicitly owner-approved later revisions take precedence until these private files are reconciled under issue #14. Historical PR checkpoints, older copies of the private sources and the archived developer log are not an authorization to change the approved story, art, probability rules, energy, checkpoints, saves or original presentation. The repository includes no private source PDFs or unpublished reference sheets.

For older technical decisions use the [historical development log](development-history.md), [narrative history](narrative-engine.md), [AI evaluation history](ai-local-evaluation.md) and [original artwork pipeline](assets.md). The [documentation audit](documentation-audit.md) tracks the separation of historical and current status. Final private-source synchronization and deployment-specific documents remain open under issue #14.
