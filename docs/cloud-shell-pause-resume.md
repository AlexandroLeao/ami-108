# Safe Cloud Shell pause and resume — AMI-108

> **Current owner recovery and pause guide — November 20, 2026.** Earlier one-time operations and superseded commands are preserved separately in [historical runbook](cloud-shell-pause-history.md). Never paste those older commands into the current recovered database.

## Current resumed environment — November 20 (owner-verified)

The previously reported replacement VM has since been **recovered** using the verified seven-session backup. Owner terminal evidence confirms: SHA-256 PASS; complete PostgreSQL 17.11 archive read; initially **zero public objects** in a new PostgreSQL 17 container; **one successful transaction-protected restore**; recount **7 sessions | 0 pending | 4 completed migrations**. The approved local game remains on `14ea583`, not the documentation-only GitHub `main` head. Web, API, FastAPI and database are all **healthy**, and the owner confirmed existing **Continue** on the private port 3000. **No second restore, new DB or repeat image builds are authorized by this status.**

At this checkpoint, the API reports **game generation OFF**, Ollama is **not installed on this new VM**, and root free disk is **5.8 GiB**. The previous Qwen2.5:1.5b 10/10 evidence and API activation took place on the *previous VM*; they are not proof of model residency today. The original preparation/activation scripts hardcode a **six-session** checkpoint, and model preparation additionally requires **10 GiB** free. Do **not** run them unchanged, bypass their guards, delete a Docker volume/cache, or pull the model until resources and a reviewed seven-session-safe procedure are established. Preserve the private archive and `.env`; complete the remaining release QA independently.

## Previous read-only Cloud Shell inspection — November 20 (before recovery)

The owner ran the versioned [read-only resume diagnostic](../scripts/check-resume-readonly.sh) after reopening **standard** Cloud Shell. It reported: accepted local `main` at `14ea583`, clean tree, restricted and ignored private `.env`; newest archive `pause-ami108-20261120T005447Z-121510.dump` (**182,626 bytes**) with `BACKUP_CHECKSUM=PASS`. Docker is available but **no AMI containers or volumes exist** on the current VM. Available disk: root **10 GiB (92% used)**, home **1.7 GiB**. The archive's full read and **7 sessions / 0 pending / 4 migrations** were verified at the *prior pause*, **not yet in the new VM**. Docker images and runtime model residency have not been checked.

**Historical operator gate (completed before the restore):** read-only inspect Docker image usage (`docker system df`, `docker image ls`) and disk headroom, then verify PostgreSQL archive structure/full readability with the existing matching image (if present). Do **not** create a DB, pull/rebuild images, run `pg_restore`, prune Docker or rerun AI/model scripts until a controlled plan confirms the target DB is **empty** and resources are adequate. If a populated DB appears, preserve it and stop. Do not fast-forward the accepted local game checkout just because GitHub documentation advanced.

## Verified state before this pause

The approved local game remains on clean commit `14ea583a83c7c1473bc94f3b1d515a8497827ac3`, on the private Docker Compose Web Preview (port 3000). The owner previously recovered a verified final private PostgreSQL 17 dump into a *confirmed empty* DB, preserving **6 sessions / 0 pending / 4 completed migrations** at the recovery and API activation checkpoints. The model is pinned Qwen2.5:1.5b (ID `65ec06548149`) in an Ollama container limited to 3 GiB and an internal-only network, and a warmed direct 10/10 authorized bilingual FastAPI check passed.

After `AMI_AI_GENERATION=1` was enabled by recreating **only** the API, the owner confirmed that Continue worked and subsequently reported successful new-game checks in **desktop/mobile and PT-BR/English**, including greater variation in RANDOM utterances. These are owner-observed functional acceptance results, **not** per-receipt telemetry, formal accessibility audit, sustained performance evidence or public-production acceptance.

**A new game creates more saved sessions.** The authoritative *current* count must be read at shutdown, not assumed to still be six. **The owner has since completed the safe pause:** 7 sessions / 0 pending / 4 migrations were verified before and after a full-read, checksum-validated new private dump. The completed pause details are below; the six-session value remains the initial recovery checkpoint. The current release gate remains [formal QA/security](release-readiness-matrix.md), while private Master v1.14 and Script v1.12 still require approved Chapter 5 synchronization.

## Confirmed owner shutdown — November 20 UTC

The owner provided `=== SAFE PAUSE COMPLETE ===` after running the versioned script. Its final non-secret report confirmed **7 sessions, 0 pending generations, 4 completed migrations**, the private dump `pause-ami108-20261120T005447Z-121510.dump` (**182,626 bytes**), completed full PostgreSQL archive inspection, `BACKUP_SHA256=PASS` and `PRIVATE_ENV_COPY=PRESENT`. Docker reported Web/API/AI/DB stopped; the script also stopped named Ollama. No volumes were removed. The earlier six-session archive remains a historical recovery point.

**Historical checkpoint (subsequently recovered):** the old VM was shut down safely, and the new VM is now open without AMI containers/volumes. **Do not rerun the pause command** before restoring a verified working stack. On the next session, inspect the existing VM and retained files first; restore the newest verified dump only if the prior DB volume has actually disappeared and a new empty target has been checked. The following shutdown instructions are retained for a **future** deliberate pause, not as an operation required today.

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
