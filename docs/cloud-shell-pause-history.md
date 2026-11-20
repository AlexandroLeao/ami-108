# Historical Cloud Shell pause/recovery runbook — November 19, 2026

> **ARCHIVED — NOT THE CURRENT SHUTDOWN COMMAND.** The original runbook below records older recovery, manual pause, model installation and activation stages. Do not run its hardcoded scripts against a newer game state. For the **current AI-OFF pause state** and future-return decision tree, use [safe Cloud Shell pause/resume](cloud-shell-pause-resume.md). The earlier [AI-ON pause script](../scripts/pause-cloud-shell-safely.sh) is not compatible with the latest environment and must not be rerun without an environment-specific safety review. Player data and backups must not be deleted or restored into a populated database.

---

## Original archived runbook — Safe Cloud Shell pause and resume (November 19, 2026)

## Accepted state at handoff

- Private source: `AlexandroLeao/ami-108`. Accepted local game runtime baseline (later GitHub commits are documentation/diagnostic-only; see current `main`) `14ea583a83c7c1473bc94f3b1d515a8497827ac3` (PR #53). The approved five chapters, original art, layout, story, rules and saves remain frozen.
- Exact main [CI 44606120570](https://github.com/AlexandroLeao/ami-108/actions/runs/44606120570) passed both jobs; exact PR #53 CI 44603955413: **105 API + 44 web + 72 Python = 221 tests**, four Prisma migrations, lint/types/build, full built campaign and 12 artwork hashes.
- Approved isolated port-3002 candidate `96556a0`: seven validated generation receipts, no timeout/fallback; DOG RANDOM 2/2 distinct and RAT RANDOM 2/2 distinct; approved BOAR authored only; model remained resident (`Forever`). Owner completed full campaign and confirmed a **fresh** port-3000 game works and its new RANDOM utterances vary. Prior Continue on old sessions correctly reuses immutable saved responses, not a new model call.
- Owner installed `14ea583a83c7c1473bc94f3b1d515a8497827ac3` on Cloud Shell port 3000: verified private backup `pre-variety-20261119-201700.dump`, five sessions / zero pending generations preserved **at installation**; API/Web/AI rebuilt and all four services healthy; direct AI evaluator 10/10; persistent `AMI_OLLAMA_KEEP_ALIVE=-1` and live Ollama `Forever`. Post-install root disk 13 GiB free / 90% used; no prune. A newer fresh-session count has not yet been audited; check at shutdown.
- Pinned local-only model Qwen2.5:1.5b ID `65ec06548149` on `ami108-local-ollama` and internal-only `ami108-local-inference`; Docker model memory limit 3 GiB. Two-second HTTP / 2.5-second engine deadlines unchanged; BOAR is never model-generated.
- Unresolved formal issues: #12 release security/QA (browser screen-reader and reduced motion/automated scan, production trusted origin, ingress/rate limits/retention, OS/image review), #13 hosted zero-cost deployment decision, #14 canonical private Master v1.14 / Script v1.12 synchronization and final documentation, #15 explicit publication/classification/license approval. **Not release-ready. No public deployments or paid provisioning.**
- Prior GitHub PRs #44–#53 merged and branch CI green; do not close open release issues merely to pause.

## Latest recovered environment — November 19 (after this historical pause)

The owner verified the **final** private archive `pause-ami108-20261119T203206Z-180786.dump` (160,719 bytes, SHA-256 PASS), enumerated all five game tables and completed an isolated PostgreSQL 17 archive read. The former Docker VM volumes were absent, so the owner restored the archive **once** into a confirmed empty PostgreSQL database, yielding **6 saved sessions, 0 pending generations and 4 completed migrations**. Rebuilt Web/API/AI and the recovered DB passed health checks; Continue successfully resumed the original save. No additional restore is needed or safe on that now-populated database. Ollama is still absent on the recovered VM and app generation remains temporarily disabled until a separately reviewed pin/network/model validation and explicit opt-in. See [current QA evidence](release-qa.md) and [release-readiness matrix](release-readiness-matrix.md).

The shutdown procedure below is **historical** and must not be rerun on the recovered stack; use it only for a future deliberate pause after separately checking the actual running state.

## Why a database export is mandatory

Google Cloud Shell provides a persistent approximately 5 GB `$HOME`, but the VM and Docker root, images, containers and unnamed/named Docker volumes **may be discarded** when a session expires. Saving a Docker volume only in that VM is not an archival backup. Keep private custom-format PostgreSQL dumps and checksums **inside `$HOME/ami-108-backups`**, not `/tmp` or the Docker root, and maintain an independent encrypted copy outside Cloud Shell for disaster recovery if approved. `.env` contains secrets and must remain untracked; a private `$HOME` copy must never be pasted into tickets or chat. GitHub preserves the source but not the runtime database or loaded model.

Official reference: https://docs.cloud.google.com/shell/docs/how-cloud-shell-works

## Safe shutdown procedure — owner runs in an active Cloud Shell terminal

Close the game and Web Preview tabs before starting. This **does not delete volumes, images or saved rows**. Stop web/API before export to avoid in-flight writes. Use a new uniquely named backup, validate archive structure plus a complete read and SHA-256, then stop AI, DB and the named local Ollama container. Abort on any failed check; do not `docker compose down -v`, `docker volume prune`, `docker system prune` or restore over a populated DB. The command is idempotent for already stopped services; it creates another uniquely named backup.

```bash
(
  set -euo pipefail
  cd ~/ami-108
  umask 077
  set +x

  echo "=== PAUSE BASELINE ==="
  test "$(git branch --show-current)" = "main"
  test -z "$(git status --porcelain)"
  test "$(git rev-parse HEAD)" = "14ea583a83c7c1473bc94f3b1d515a8497827ac3"
  test -f .env
  git check-ignore -q .env

  echo "=== STOPPING WRITERS ==="
  docker compose stop web api

  counts() {
    docker compose exec -T db sh -ec       'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\"), (SELECT count(*) FROM \"GamePendingGeneration\");"'
  }
  before=$(counts)
  printf 'Sessions|Pending: %s\n' "$before"
  [[ "$before" =~ ^[0-9]+\|0$ ]]
  test "${before%%|*}" -ge 1

  echo "=== VERIFIED PRIVATE BACKUP ==="
  test "$(df -Pk /home | awk 'NR==2 {print $4}')" -ge 262144
  dir="$HOME/ami-108-backups"
  mkdir -p "$dir"
  chmod 700 "$dir"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
  backup="$dir/pause-ami108-$stamp.dump"
  tmp=$(mktemp "$dir/.pause-XXXXXXXX.dump")
  docker compose exec -T db sh -ec     'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$tmp"
  test -s "$tmp"
  docker compose exec -T db pg_restore --list < "$tmp" > /dev/null
  docker compose exec -T db pg_restore --file=/dev/null < "$tmp"
  mv "$tmp" "$backup"
  sha256sum "$backup" > "$backup.sha256"
  (cd "$dir" && sha256sum -c "$(basename "$backup").sha256")

  cp -p .env "$dir/.env-pause-$stamp"
  chmod 600 "$dir/.env-pause-$stamp"

  after=$(counts)
  test "$before" = "$after"

  printf 'Commit: %s\nSessions|Pending: %s\nBackup: %s\n'     "$(git rev-parse HEAD)" "$after" "$backup" > "$dir/pause-ami108-$stamp.status"
  chmod 600 "$dir/pause-ami108-$stamp.status"

  echo "=== STOPPING SERVICES ==="
  docker compose stop ai db
  if docker inspect ami108-local-ollama > /dev/null 2>&1; then
    if test "$(docker inspect --format '{{.State.Running}}' ami108-local-ollama)" = true; then
      docker stop -t 30 ami108-local-ollama
    fi
  fi

  echo "=== PAUSE REPORT (NO SECRETS) ==="
  echo "Sessions|Pending: $after"
  echo "Verified dump: $backup"
  ls -lh "$backup" "$backup.sha256"
  git status --short --branch
  docker compose ps -a
  df -h / /home
  echo "=== SAFE PAUSE COMPLETE ==="
)
```

Only after `SAFE PAUSE COMPLETE` should the operator use `exit` or close Cloud Shell. If `pg_dump` or validation fails, stop: database service is still running, and no successful pause has been demonstrated. A partial `.pause-*.dump` may remain; do not rely on it. Never output or upload private `.env` or a raw save archive to a public issue.

## First return: non-destructive evidence collection

Run the [read-only resume check](../scripts/check-resume-readonly.sh) **before** starting or restoring services. It only inspects Git, checks the hash of the newest local backup if its `.sha256` companion exists, reports private environment presence/permissions without displaying values, and lists existing AMI containers/volumes if Docker is available. It does **not** run `pg_restore`, modify the database, fetch models, expose secrets or activate the game. The checksum verifies downloaded/saved bytes, **not** the archive structure or data restoration.

If the local checkout is still on `14ea583`, fetch documentation without changing the local worktree:

```bash
cd ~/ami-108
git fetch origin main
git show origin/main:scripts/check-resume-readonly.sh > /tmp/ami108-check-resume.sh
bash -n /tmp/ami108-check-resume.sh && bash /tmp/ami108-check-resume.sh
```

A missing/corrupt checksum, missing private environment, unavailable Docker or changed working tree is a **stop-and-review** result, not permission to restore, prune, overwrite or recreate anything. If the newest dump is missing, inspect earlier known-good backups by name without overwriting them; the owner may have a later archive from the shutdown command, but no terminal evidence has been supplied yet. Share only the non-secret diagnostic output. Resume procedures below depend on which resources actually survived.

## After verifying restored saves: optional local model preparation

The owner has confirmed **6 restored sessions / 0 pending / 4 migrations**, all four services healthy and Continue working. The accepted runtime is still `14ea583`; the API was deliberately started with `AMI_AI_GENERATION=0`. Do not repeat the database restore. If sufficient RAM/disk is available and the owner wants live AI again, use the reviewed [pinned local model preparation script](../scripts/prepare-pinned-local-ollama.sh). It verifies this exact recovery baseline and existing healthy containers, pulls the *previously approved digest*, downloads the local model while it has network access (with **no host port published**), moves Ollama onto its internal-only network, connects the existing AI container, warms it, then runs **ten authenticated, bilingual requests directly against the AI service** without writing game data. It checks the six-session count before and after and leaves game inference disabled. The temporary bridge connection during download is removed before validation completes; if bootstrap fails before isolation, the script stops its own model container and leaves resources intact for operator review.

To use without changing the game's local Git checkout:

```bash
cd ~/ami-108
git fetch origin main
git show origin/main:scripts/prepare-pinned-local-ollama.sh > /tmp/ami108-model-prepare.sh
bash -n /tmp/ami108-model-prepare.sh && bash /tmp/ami108-model-prepare.sh
```

**Only** after `LOCAL MODEL PREPARED — GAME INFERENCE NOT YET ENABLED` and **10/10 VALIDATED** may the separate API-generation activation gate be considered, with the owner verifying unchanged saves and Continue. The model script is **not idempotent**: do not rerun it after any partial setup; instead inspect the model/network and request a targeted continuation. If memory/disk, private model settings, exact model ID, endpoints or saved-session count differ, it aborts rather than guessing. No cloud-model subscription, public deployment or new secrets.

## Recovered model: first test was 8/10, so DO NOT rerun the installer

The owner executed pinned model setup on the recovered VM: approved image digest and Qwen ID verified, private isolation reached, warmup took 3925 ms, direct bilingual authenticated test returned **8/10 VALIDATED** with two PT-BR `TIMEOUT` fallbacks at ~2 seconds. The script stopped before its final post-test session count and `ollama ps` check. App inference was OFF in preflight and the first count was `6|0|4`; no player database writes or activation were performed by the installer. This is *not* a 10/10 acceptance.

Use the [existing warmed-model recheck](../scripts/recheck-warm-local-ai.sh) **instead of** repeating `prepare-pinned-local-ollama.sh`. It does not install or mutate anything and rechecks the model's internal-only network, no host ports, fixed 3 GiB cap, exact pinned image/model, healthy services and game generation OFF. After ten direct authorized cases, it verifies the existing six sessions and unchanged app inference. Keep the 2-second transport / 2.5-second application deadlines unchanged. Only request the separate gameplay opt-in once the owner submits a clean 10/10 direct test and model residency evidence. If recheck fails, leave gameplay generation OFF and investigate timing. Never prune volumes or restore again.

## Verified warmed Qwen — next gate is API-only activation

Owner subsequently ran the existing-model recheck and obtained **10/10 VALIDATED** with both locales, a resident pinned Qwen2.5:1.5b (`UNTIL Forever`) and unchanged **6/0/4** save/pending/migration counts before and after. The 2-second provider transport / 2.5-second app deadlines remain unchanged. This supersedes the initial **8/10** as a *current model-readiness assessment*, but does not erase that historical first-run timeout evidence. API game generation was still **OFF** after 10/10.

For a controlled owner-approved opt-in, use the new [API-only activation script](../scripts/activate-verified-local-ai.sh) retrieved from the exact reviewed GitHub main commit. **Close active game/Web Preview tabs first.** The script verifies the accepted clean local runtime and pinned isolated resident model, checks **6 sessions/0 pending/4 migrations** and that inference is OFF, saves a private copy of the existing untracked `.env` outside the repository, edits **only** `AMI_AI_GENERATION=1`, recreates **only** the API container (without rebuilding images), verifies three health endpoints and the same DB container/count, and attempts to return API generation to OFF on failure. No database restore or volume reset is permitted. If the script fails, inspect the result; **do not rerun blindly**.

A successful script activation is **not** a new-game E2E model validation. After success, the owner must first verify Continue with the original browser and then test real generation in an **isolated new browser session** (never replace the original session) with INTRO, DOG/RAT consults, variation, and receipt summaries. No public hosting or paid inference is implied.

## Activation completed — do not rerun on this recovered VM

After the successful resident 10/10 FastAPI benchmark, the owner ran [API-only activation](../scripts/activate-verified-local-ai.sh). The terminal confirmed `CURRENT_GAME_GENERATION=ON`, healthy Web 3000/API 3001/AI 8000 endpoints and unchanged **6 sessions / 0 pending / 4 migrations**, with the pinned Qwen2.5:1.5b resident at `Forever`. The owner confirmed **Continue** still functions in the original browser. The private `.env` was backed up outside the repository and only the API container was recreated. **This supersedes the earlier 8/10 and generation-OFF state as the latest local operating condition.** Keep those prior paragraphs as chronological history, not commands to repeat.

**Do not rerun the restore, pinned Ollama preparation, warmed model recheck or API activation against the currently recovered environment.** Next verification: private port 3000 in a **separate browser profile/incognito** for a fresh game, INTRO and DOG/RAT text and bilingual variation; preserve existing session cookies. If the model fails, diagnose without touching the six existing saves. Public release is still unapproved.

## Resume without touching saved data

1. Reopen normal (non-ephemeral) Google Cloud Shell; `cd ~/ami-108`; check `git status --short --branch`, `git rev-parse HEAD`, `df -h / /home`, `docker compose ps -a`, `docker volume ls` and `ls -lh ~/ami-108-backups/pause-ami108-*.dump`. Confirm `.env` exists privately without displaying its values.
2. Verify the exact selected archive by `cd ~/ami-108-backups && sha256sum -c <selected basename>.dump.sha256`; inspect its archive structure with `pg_restore --list` on an appropriate PostgreSQL 17 environment. Retain multiple known-good backups until a recovery has been proved.
3. **If the VM and volumes survived**, start existing DB, AI, local Ollama, API and Web in dependency/health order, without destructive Compose flags. Check four migrations, record session/pending counts, verify pin/private network/model and run the ten-case direct regression; then verify **Continue** on the same private origin/browser. Do not restore a database just because a previous process stopped.
4. **If Docker images/volumes were recycled**, reconstruct the pinned offline-first stack from the accepted commit with a fresh isolated volume. Verify that the target DB is **empty** before restoring the selected custom-format dump. Restore only once and verify row counts and Continue, then restore the pinned locally hosted model and verify the 3 GiB/internal network/no-public-port constraints before enabling inference. Request a controlled restore plan at resume time; do not paste secrets or issue a blind `pg_restore` into a nonempty DB.
5. Re-check private documentation/source synchronization, owner-approved acceptance, current advisories and CI if any commit changed. Production or public hosting requires separate authorization and acceptance.

This file specifies the pause operation; **the shutdown and new archive are not considered complete until the owner provides the terminal result**.
