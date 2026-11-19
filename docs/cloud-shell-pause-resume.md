# Safe Cloud Shell pause and resume — November 19, 2026

## Accepted state at handoff

- Private source: `AlexandroLeao/ami-108`. Local and GitHub runtime baseline `14ea583a83c7c1473bc94f3b1d515a8497827ac3` (PR #53). The approved five chapters, original art, layout, story, rules and saves remain frozen.
- Exact main [CI 44606120570](https://github.com/AlexandroLeao/ami-108/actions/runs/44606120570) passed both jobs; exact PR #53 CI 44603955413: **105 API + 44 web + 72 Python = 221 tests**, four Prisma migrations, lint/types/build, full built campaign and 12 artwork hashes.
- Approved isolated port-3002 candidate `96556a0`: seven validated generation receipts, no timeout/fallback; DOG RANDOM 2/2 distinct and RAT RANDOM 2/2 distinct; approved BOAR authored only; model remained resident (`Forever`). Owner completed full campaign and confirmed a **fresh** port-3000 game works and its new RANDOM utterances vary. Prior Continue on old sessions correctly reuses immutable saved responses, not a new model call.
- Owner installed `14ea583a83c7c1473bc94f3b1d515a8497827ac3` on Cloud Shell port 3000: verified private backup `pre-variety-20261119-201700.dump`, five sessions / zero pending generations preserved **at installation**; API/Web/AI rebuilt and all four services healthy; direct AI evaluator 10/10; persistent `AMI_OLLAMA_KEEP_ALIVE=-1` and live Ollama `Forever`. Post-install root disk 13 GiB free / 90% used; no prune. A newer fresh-session count has not yet been audited; check at shutdown.
- Pinned local-only model Qwen2.5:1.5b ID `65ec06548149` on `ami108-local-ollama` and internal-only `ami108-local-inference`; Docker model memory limit 3 GiB. Two-second HTTP / 2.5-second engine deadlines unchanged; BOAR is never model-generated.
- Unresolved formal issues: #12 release security/QA (browser screen-reader and reduced motion/automated scan, production trusted origin, ingress/rate limits/retention, OS/image review), #13 hosted zero-cost deployment decision, #14 canonical private Master v1.14 / Script v1.12 synchronization and final documentation, #15 explicit publication/classification/license approval. **Not release-ready. No public deployments or paid provisioning.**
- Prior GitHub PRs #44–#53 merged and branch CI green; do not close open release issues merely to pause.

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

## Resume without touching saved data

1. Reopen normal (non-ephemeral) Google Cloud Shell; `cd ~/ami-108`; check `git status --short --branch`, `git rev-parse HEAD`, `df -h / /home`, `docker compose ps -a`, `docker volume ls` and `ls -lh ~/ami-108-backups/pause-ami108-*.dump`. Confirm `.env` exists privately without displaying its values.
2. Verify the exact selected archive by `cd ~/ami-108-backups && sha256sum -c <selected basename>.dump.sha256`; inspect its archive structure with `pg_restore --list` on an appropriate PostgreSQL 17 environment. Retain multiple known-good backups until a recovery has been proved.
3. **If the VM and volumes survived**, start existing DB, AI, local Ollama, API and Web in dependency/health order, without destructive Compose flags. Check four migrations, record session/pending counts, verify pin/private network/model and run the ten-case direct regression; then verify **Continue** on the same private origin/browser. Do not restore a database just because a previous process stopped.
4. **If Docker images/volumes were recycled**, reconstruct the pinned offline-first stack from the accepted commit with a fresh isolated volume. Verify that the target DB is **empty** before restoring the selected custom-format dump. Restore only once and verify row counts and Continue, then restore the pinned locally hosted model and verify the 3 GiB/internal network/no-public-port constraints before enabling inference. Request a controlled restore plan at resume time; do not paste secrets or issue a blind `pg_restore` into a nonempty DB.
5. Re-check private documentation/source synchronization, owner-approved acceptance, current advisories and CI if any commit changed. Production or public hosting requires separate authorization and acceptance.

This file specifies the pause operation; **the shutdown and new archive are not considered complete until the owner provides the terminal result**.
