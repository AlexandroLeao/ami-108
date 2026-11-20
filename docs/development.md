# Development — AMI-108

> **Status: current development reference (November 19, 2026).** The archived milestone log is [development-history.md](development-history.md). Do not execute commands from that historical log against live saves. For authoritative acceptance status, see [release readiness](release-readiness-matrix.md).

## Accepted game and local state

- **Runtime code:** `14ea583a83c7c1473bc94f3b1d515a8497827ac3` (PR #53). GitHub main has subsequent documentation and recovery-tool changes, which do not require rebuilding the approved application.
- **Campaign:** five chapters, original twelve scene assets, PT-BR and EN, all checkpoints and persistent consultations; owner-approved and protected from incidental content edits.
- **Cloud Shell recovery:** the final pause archive was verified and restored **once** into a confirmed empty PostgreSQL 17 database. **Six sessions, zero pending generations, four completed migrations** recovered; DB, API, AI service and Web were healthy and Continue worked in the original browser.
- **Inference status at latest owner report:** the pinned Qwen2.5:1.5b model was verified resident (`Forever`), and its authenticated bilingual **10/10** warm direct check passed. The owner executed [guarded API-only activation](../scripts/activate-verified-local-ai.sh), verified `CURRENT_GAME_GENERATION=ON`, three healthy endpoints, the original 6 sessions / 0 pending / 4 migrations and successful Continue in the browser. **Actual new-game generation and variation in a separate browser session on this recovered VM remain to be checked.** Do not rerun model installation or API activation on the active stack.
- **Release:** private local preview, not hosted production. No public release, paid resources, licensing grant or official content rating. See [QA](release-qa.md), [release gates](architecture/production-security-gates.md), and [outstanding issues](release-readiness-matrix.md).

## Latest owner gameplay check and end-of-day boundary

The owner subsequently confirmed successful **desktop and mobile** private browser tests in **PT-BR and English**, including normal Continue and more varied RANDOM responses with generation ON. This is functional acceptance, not formal screen-reader, reduced-motion, production-security or performance certification. Because the owner created new games, the prior **six sessions** were a *pre-playtest snapshot*, not a count to hardcode in today's archive. Use the new [dynamic-count safe shutdown](cloud-shell-pause-resume.md) and review its verified backup report before closing Cloud Shell. Never rerun last session's database restore, local model install or API activation.

## Verified end-of-day stop — November 20 UTC

The owner's final safe-pause terminal report records **7 GameSession, 0 GamePendingGeneration and 4 completed migrations** before and after the PostgreSQL export. The new private custom-format archive `pause-ami108-20261120T005447Z-121510.dump` is **182,626 bytes**, passed list/full-read and SHA-256 checks, and a private `.env` copy was saved. Web, API, AI, PostgreSQL and Ollama are **stopped**; no Docker volume was deleted. The post-new-game count is seven (not the six at initial recovery). On the next session, inspect [safe pause/resume](cloud-shell-pause-resume.md) before starting or restoring anything. Do not treat this as formal release/security acceptance.

## Prerequisites and local boundaries

Development requires Docker Engine with Compose CLI plugin, Node.js 22 (>=22.12), pnpm 10.15.1 through Corepack, Python 3.12 and uv. The accepted manual environment is Google Cloud Shell; Codespaces is an unverified optional alternative. Cloud Shell Docker VMs and volumes may be replaced between sessions; the user's private `$HOME` backup is a separate preservation requirement.

The local `compose.yaml` uses `AMI_DEV_PREVIEW=1`, exposes only loopback ports **3000** (Web), **3001** (API) and **8000** (AI health/authorized interface), with PostgreSQL internal to Docker. The original Ollama model must remain on an internal-only Docker network **without host-published port**. Public hosting requires additional authorization, trusted TLS/origin, ingress controls and security review. A container's `healthy` state is not proof of model inference.

Copy `.env.example` to `.env` **only when provisioning a genuinely new, disposable environment**. Never replace the existing private `.env`, share it, add it to Git, or commit dumps or cookies. Use a local URL-safe PostgreSQL password (or encode it appropriately for `DATABASE_URL`), independent secure internal token, and no paid/cloud model provider.

## Safe checks on the recovered environment

These commands inspect the existing stack without resetting it:

```bash
cd ~/ami-108
git status --short --branch
git rev-parse HEAD
docker compose ps
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3001/health/ready
curl -fsS http://localhost:8000/health
df -h / /home
```

The recovered game is on port **3000**. Keep the same browser/origin and its existing cookies for Continue. For a future VM replacement, use the [read-only recovery diagnostic](../scripts/check-resume-readonly.sh), followed by the [Cloud Shell pause/resume runbook](cloud-shell-pause-resume.md) to verify the latest dump and **confirm an empty target before any restoration**. Never run `docker compose down -v`, volume prune, `docker system prune`, or a second restore into an already populated database.

**For future recovery only:** [pinned local model preparation](../scripts/prepare-pinned-local-ollama.sh) is a one-time operation. It has already been completed on this recovered VM, and the separate API-only game inference activation also succeeded. **Do not rerun either script** on the active stack. The remaining owner QA step is a new game in a separate browser context, after Continue has been verified.

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
