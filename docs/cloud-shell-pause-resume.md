# Safe Cloud Shell pause and resume — AMI-108

> **Current owner recovery and pause guide — November 19, 2026.** Earlier one-time operations and superseded commands are preserved separately in [historical runbook](cloud-shell-pause-history.md). Never paste those older commands into the current recovered database.

## Verified state before this pause

The approved local game remains on clean commit `14ea583a83c7c1473bc94f3b1d515a8497827ac3`, on the private Docker Compose Web Preview (port 3000). The owner previously recovered a verified final private PostgreSQL 17 dump into a *confirmed empty* DB, preserving **6 sessions / 0 pending / 4 completed migrations** at the recovery and API activation checkpoints. The model is pinned Qwen2.5:1.5b (ID `65ec06548149`) in an Ollama container limited to 3 GiB and an internal-only network, and a warmed direct 10/10 authorized bilingual FastAPI check passed.

After `AMI_AI_GENERATION=1` was enabled by recreating **only** the API, the owner confirmed that Continue worked and subsequently reported successful new-game checks in **desktop/mobile and PT-BR/English**, including greater variation in RANDOM utterances. These are owner-observed functional acceptance results, **not** per-receipt telemetry, formal accessibility audit, sustained performance evidence or public-production acceptance.

**A new game creates more saved sessions.** The authoritative *current* count must be read at shutdown, not assumed to still be six. There is no new backup evidence yet for today's playtests. The current release gate remains [formal QA/security](release-readiness-matrix.md), while private Master v1.14 and Script v1.12 still require approved Chapter 5 synchronization.

## Safe owner-run shutdown — do not delete Docker data

First close every game and Web Preview tab, including the separate mobile and incognito sessions. Then use the reviewed [end-of-day pause script](../scripts/pause-cloud-shell-safely.sh), retrieved from the current merged main **without changing the accepted local runtime commit**:

```bash
(
  set -euo pipefail
  cd ~/ami-108
  git fetch origin main
  script=$(mktemp /tmp/ami108-safe-pause.XXXXXX)
  trap 'rm -f "$script"' EXIT
  git show origin/main:scripts/pause-cloud-shell-safely.sh > "$script"
  bash -n "$script"
  bash "$script"
)
```

The script will:

1. Reject a modified/non-approved runtime, missing or unsafe private `.env`, unhealthy services or a disabled local AI setting *before* stopping writers.
2. Stop **only Web and API first**, so PostgreSQL stops receiving new gameplay writes; check the actual saved-session count (at least the original six), **zero pending generations** and four completed migrations. If this condition is not satisfied, stop and review; do not discard pending work.
3. Create a **new** uniquely named, private custom-format PostgreSQL dump in `$HOME/ami-108-backups`, check its archive listing and **read the whole archive** using `pg_restore` without restoring into a database, then save and verify SHA-256. Preserve an additional private `.env` copy (no secrets printed).
4. Recheck DB container identity and exact counts; only after successful verification stop the AI service, database and named resident Ollama container **without removing images, volumes, containers or private files**.
5. Print `=== SAFE PAUSE COMPLETE ===` and the non-secret save totals, dump filename, size and disk health. **Only this final banner confirms it is ready to exit.**

If the script stops early or prints `SAFE_PAUSE=NOT_COMPLETE`, **do not close the Cloud Shell yet or rerun the script blindly**. Preserve the displayed output for investigation. The DB may still be running even if the Web/API writers were stopped. Never run `docker compose down -v`, `docker system prune`, `docker volume prune`, `pg_restore` into a populated database or `git pull` just to pause.

After `SAFE PAUSE COMPLETE`, run `exit` and close the Cloud Shell terminal window. No new public hosting is created or billed by this action.

## Data preservation boundaries

According to [Google Cloud Shell documentation](https://docs.cloud.google.com/shell/docs/how-cloud-shell-works), normal Cloud Shell uses a temporary VM but preserves approximately 5 GB under `$HOME`; Docker VM images/containers/volumes may disappear between sessions. That is **why the new verified dump and its checksum must be in `$HOME`**. This does not protect against deletion of the home directory or account problems, so an **independent encrypted off-platform backup** is recommended if approved. Do not use Cloud Shell *ephemeral mode* for these private saves. Do not paste `.env`, cookies or raw `.dump` files into issues or chat.

## Safe return: inspect, never assume

1. Open standard (non-ephemeral) Cloud Shell; inspect `git status --short --branch`, local accepted SHA, Docker state and `~/ami-108-backups`. Run [read-only recovery diagnostics](../scripts/check-resume-readonly.sh) from latest GitHub main using `git show`, without changing the game checkout.
2. Identify the newest **checksum-verified** dump from the *last pause*. Verify full PostgreSQL custom-format archive readability. Compare saved counts with its private pause status file; do not infer counts from previous sessions.
3. If existing Docker DB volumes survive, **do not restore**; verify sessions/migrations and start services in a controlled order. If the VM recycled, rebuild only after establishing the exact approved runtime, a **new empty** target DB, and a controlled one-time restore using the selected archive. Never delete an existing populated DB.
4. The pinned local Qwen model may need to be downloaded/reconnected on a replacement VM; do not blindly rerun [model preparation](../scripts/prepare-pinned-local-ollama.sh) or [API activation](../scripts/activate-verified-local-ai.sh) on an existing active stack. Recheck model pin/network/resources and then verify Continue and live inference separately.
5. Resume remaining release tasks under [#12 QA/security](https://github.com/AlexandroLeao/ami-108/issues/12), [#13 hosting](https://github.com/AlexandroLeao/ami-108/issues/13), [#14 private canonical docs](https://github.com/AlexandroLeao/ami-108/issues/14) and [#15 release approval](https://github.com/AlexandroLeao/ami-108/issues/15). Do not publish or incur costs without explicit owner approval.

The historical pause/recovery log, including the first recycled-VM recovery, earlier 8/10 timeout, warmed 10/10 recheck and API activation, is [archived for traceability](cloud-shell-pause-history.md).
