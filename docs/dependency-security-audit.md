# Dependency security audit — AMI-010

## Observed baseline (2026-11-19)

Owner-provided Cloud Shell terminal output at clean main `a27f4dac4ad29ba18c500ad5b64de7d2cd2d4351`, with the existing API image and read-only Python lockfile mounts. Disposable containers; no dependency changes, no database writes or paid resources. All four Compose services remained healthy; 18 GB root free (86% used). The image revision was not independently attested by the scan. Previous backup and two-session preservation were documented in #12; this dependency scan did not recount sessions.

| Scope | Tool | Dependencies reported | Advisory records | Exit |
| --- | --- | ---: | --- | ---: |
| JS production | pnpm 10.15.1 audit --prod | 226 | 1 high | 1 |
| JS full | pnpm 10.15.1 audit | 856 | 2 critical, 1 high, 4 moderate | 1 |
| Python runtime | pip-audit 2.10.1, uv 0.10.0 locked export | 14 | none known | 0 |
| Python all groups | same | 29 | none known | 0 |

JS full contains six unique advisory IDs across seven records (one advisory applies to two package names). Production is a subset, not an eighth finding. Python results cover the pinned exported packages only; no OS/container, secret, license or comprehensive application security certification. pip-audit reported the expected unhashed-export warning.

## Triage and remediation gates

| Advisory | Locked package and path | Severity | Minimum fix reported by scan |
| --- | --- | --- | --- |
| [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) | deepmerge-ts 7.1.5 via Prisma client/CLI/config | High | 8.0.0 |
| [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) | tinypool 1.1.1 via Vitest | Critical | 2.1.1 |
| [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) | tinypool 1.1.1 via Vitest | Critical | 2.1.2 |
| [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | vitest and @vitest/mocker 3.2.7 | Moderate (two records) | 4.1.11 |
| [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | @vitest/mocker 3.2.7 | Moderate | 4.1.12 |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | minimatch 10.2.6 via typescript-eslint/typescript-estree | Moderate | 11.0.1 |

- **Prisma:** matching client and CLI are pinned to 6.19.3. The advisory requires recursive object graphs, not ordinary JSON alone. No direct player-controlled recursive merge has been established; Prisma config/migration tooling and its transitive production resolution remain relevant. Check for a compatible upstream patch first. A major Prisma migration or deepmerge-ts override requires explicit compatibility evidence and separate owner approval; do not alter schema or migration history to silence an audit.
- **Vitest:** web manifest uses `vitest run` as a development dependency; no standalone mocker plugin configuration was found in the inspected web root. The advisory preconditions concern a reachable development server or an upstream prototype-pollution primitive; neither is established in this application. Do not expose test/dev servers or run untrusted code with secrets. Prefer exact Vitest 4.1.12 or a verified compatible patched release, then resolve the lockfile with pnpm and confirm vulnerable tinypool/mocker are removed or fixed. Do not assume a Vitest upgrade alone fixes every advisory.
- **ESLint:** API lint uses typescript-eslint 8.72.2 with TypeScript 5.9.3. minimatch advisory requires attacker-controlled glob patterns at optimization level >= 2. No direct game path is established. Find an upstream compatible release; evaluate Node 22, peer ranges, lint and typecheck. Do not force minimatch 11 across all consumers.
- **Image composition:** infra/node.Dockerfile installs the full workspace and inherits it in both runtime images; development tooling is physically present even though the web command runs Next start and the API runs compiled NestJS after Prisma migrate deploy. A production-only multi-stage packaging proposal must account for Prisma CLI/migrations and generated client, Next assets, and the smoke suite. It is not a substitute for patching CI tooling.
- **No advisory suppression:** no audit ignore, forced update, broad override, manually invented lock integrity, or automatic major upgrade. Findings remain open until a new locked scan and regression review demonstrate remediation or an explicitly approved documented risk decision.

## Read-only candidate discovery

Run the commands from an existing local clone with the current API image; no install, lockfile change, image rebuild, secrets, or database mount. The package metadata registry is external; results may change. The command queries version/engine/dependency/peer metadata only.

```bash
(
  set -euo pipefail
  cd ~/ami-108
  git rev-parse --short HEAD
  image=$(docker inspect --format '{{.Image}}' ami-108-api-1)
  docker run --rm --entrypoint sh -w /app "$image" -ec '
    for pkg in vitest@4.1.12 @vitest/mocker@4.1.12 tinypool@2.1.2 prisma@6 @prisma/client@6 @prisma/config@6 deepmerge-ts@8 typescript-eslint@8 @typescript-eslint/typescript-estree@8 minimatch@11.0.1; do
      printf "\\n=== %s ===\\n" "$pkg"
      pnpm view "$pkg" version engines dependencies peerDependencies --json
    done
  '
  git status --short --branch
)
```

Use exact candidate versions with compatible metadata, not unbounded updates. For each approved remediation PR, generate the lockfile using pnpm 10.15.1 in an isolated checkout, review the entire diff and re-run production/full JS audit. Require frozen install, Prisma generation, all four existing migrations on disposable PostgreSQL, lint/typecheck, API/web/Python tests, build and complete built HTTP smoke with twelve artwork hashes. Keep real saves, environment files and credentials out of CI. Before live application, verify the private backup and owner approval; do not use `docker compose down -v`.

## Related security baseline

PR #44 at `24b0efffe7c0a8f1cad7d076b1ab63ec07baf5f7` passed [CI 44593999454](https://github.com/AlexandroLeao/ami-108/actions/runs/44593999454) (100 API + 41 web + 71 Python = 212 tests; one Python warning; four migrations, lint/types/build, full HTTP campaign and 12 original artwork hashes). It bounds streaming facade bodies to the existing 2048 raw bytes. It does not resolve dependency advisories or slow-client timing. It remains unmerged pending owner approval.

Production routing and trusted HTTPS origin, rate limits, retention, headers, runtime image minimization, deployment cost/eligibility, accessibility and performance remain separate gates. Local preview is not public production. No changes to narrative, art, UI, game rules, AI, saves or dependencies are made by this record.
