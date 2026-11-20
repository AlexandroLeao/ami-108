# Development — AMI-108

> **Status: current development reference (November 20, 2026).** The archived milestone log is [development-history.md](development-history.md). Do not execute commands from that historical log against live saves. For authoritative acceptance status, see [release readiness](release-readiness-matrix.md).

## Accepted game and currently verified environment

- **Accepted game runtime:** clean local `main` at `14ea583a83c7c1473bc94f3b1d515a8497827ac3`, with five approved chapters, 12 original scenes, PT-BR/EN, durable game state and consultations. GitHub `main` contains later **documentation and guarded operational QA**; do not fast-forward the accepted game checkout merely to read those scripts.
- **Previous owner-accepted gameplay:** Continue resumed correctly; desktop/mobile PT-BR/EN gameplay and varied local Qwen output were observed. The pinned model passed 10/10 direct bilingual evaluation on the previous Cloud Shell VM. These are **historical local acceptance results**, not today's model-readiness proof.
- **Latest safe pause (November 20, 15:56 UTC):** private verified PostgreSQL archive `pause-ami108-20261120T155634Z-1926.dump` (182,626 bytes; full read/SHA-256 PASS) preserved **7 sessions / 0 pending / 4 migrations** after Continue worked on the restored replacement VM. Protected `.env` copy retained; all four Compose services stopped without volume removal.
- **Latest VM state at shutdown:** the approved game ran on the replacement Cloud Shell VM with four healthy services and generation **OFF** (no Ollama). The owner verified Continue and completed a new backup before stopping the four containers. Root had **5.8 GiB free (96% used)** and `/home` **1.7 GiB free**. Earlier observations of *zero Docker containers/volumes* and *10 GiB free* were **pre-recovery historical checks**, not current resume instructions.
- **Release boundary:** private preview only, no official age rating, license grant, paid infrastructure or public hosting. Formal [QA](release-qa.md), [release-readiness](release-readiness-matrix.md) and [production security gates](architecture/production-security-gates.md) remain open.

## Prerequisites and local boundaries

Development requires Docker Engine with Compose CLI plugin, Node.js 22 (>=22.12), pnpm 10.15.1 through Corepack, Python 3.12 and uv. The accepted manual environment is Google Cloud Shell; Codespaces is an unverified optional alternative. Cloud Shell Docker VMs and volumes may be replaced between sessions; the user's private `$HOME` backup is a separate preservation requirement.

The local `compose.yaml` uses `AMI_DEV_PREVIEW=1`, exposes only loopback ports **3000** (Web), **3001** (API) and **8000** (AI health/authorized interface), with PostgreSQL internal to Docker. The original Ollama model must remain on an internal-only Docker network **without host-published port**. Public hosting requires additional authorization, trusted TLS/origin, ingress controls and security review. A container's `healthy` state is not proof of model inference.

Copy `.env.example` to `.env` **only when provisioning a genuinely new, disposable environment**. Never replace the existing private `.env`, share it, add it to Git, or commit dumps or cookies. Use a local URL-safe PostgreSQL password (or encode it appropriately for `DATABASE_URL`), independent secure internal token, and no paid/cloud model provider.

## Historical read-only inspection before the completed recovery

**Historical only:** The replacement VM had not been restored **at the time of the earlier read-only snapshot**. It was subsequently recovered, tested and safely paused as documented above. The following commands were diagnostic at that prior checkpoint; they are not instructions to repeat a restore, start services or change the approved local checkout. The reviewed [read-only diagnostic](../scripts/check-resume-readonly.sh) is still useful **after** inspecting the latest backup and Docker state on a future return. These commands do not start services, install images, create volumes or touch saves:

```bash
cd ~/ami-108
git status --short --branch
git rev-parse HEAD
docker info --format '{{.ServerVersion}}'
docker system df
docker image ls
docker ps -a
docker volume ls
df -h / /home
```

Compare results with the [current release-readiness matrix](release-readiness-matrix.md) and [safe Cloud Shell recovery runbook](cloud-shell-pause-resume.md). Inspect the newest verified archive's structure and full readability before any restore. **Never restore into a populated database**, run `docker compose down -v`, prune volumes/images or pull/rebuild the game or model blindly. If Docker images, disk space or database state are uncertain, stop and review the evidence before any write.

## Checks only after controlled restoration

After the approved runtime, PostgreSQL data and application services have been restored **and independently confirmed healthy**, inspect the previously accepted private preview endpoints:

```bash
cd ~/ami-108
docker compose ps
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3001/health/ready
curl -fsS http://localhost:8000/health
```

The previously accepted game ran on port **3000**. Keep the same browser/origin and existing cookies for Continue; verify saved sessions before running new-game tests in a separate private browser context. A healthy endpoint does **not** prove that a pinned model is installed or generating. [Pinned local model preparation](../scripts/prepare-pinned-local-ollama.sh) and [API-only activation](../scripts/activate-verified-local-ai.sh) were successfully completed **on the prior VM**, not proven on this replacement VM. Do not rerun either operation without the runbook's resource, model identity, network, backup and saved-session preconditions.

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
