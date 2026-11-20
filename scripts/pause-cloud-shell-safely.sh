#!/usr/bin/env bash
# Owner-run safe end-of-day pause for the accepted private Cloud Shell runtime.
# Creates a new, verified $HOME backup before stopping DB and local AI.
# No restore, Docker prune, volume deletion, model pull, API rebuild, or git update.
(
  set -euo pipefail
  umask 077
  set +x
  cd "${AMI108_REPO:-$HOME/ami-108}"

  completed=0
  on_exit() {
    status=$?
    if (( completed != 1 )); then
      echo 'SAFE_PAUSE=NOT_COMPLETE — do not close Cloud Shell; inspect the failure.' >&2
      echo 'Do not repeat blindly or delete backups/volumes. Existing DB may still be running.' >&2
    fi
    exit "$status"
  }
  trap on_exit EXIT

  echo '=== SAFE PAUSE: VERIFY APPROVED RUNTIME ==='
  test "$(git branch --show-current)" = main
  test "$(git rev-parse HEAD)" = 14ea583a83c7c1473bc94f3b1d515a8497827ac3
  test -z "$(git status --porcelain)"
  test -f .env
  git check-ignore -q .env
  test "$(( 8#$(stat -c '%a' .env) & 8#077 ))" -eq 0

  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$service-1")" = healthy
  done
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "1") process.exit(1);
    console.log("PRIVATE_LOCAL_GAME_AI=ON (before pause)");
  '
  test "$(docker inspect --format '{{.State.Running}}' ami108-local-ollama)" = true

  counts() {
    docker compose exec -T db sh -ec \
      'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\") || chr(124) || (SELECT count(*) FROM \"GamePendingGeneration\") || chr(124) || (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL);"'
  }
  db_id=$(docker inspect --format '{{.Id}}' ami-108-db-1)

  echo '=== STOPPING ONLY GAME WRITERS ==='
  docker compose stop web api

  before=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_BEFORE=$before"
  if [[ ! "$before" =~ ^([0-9]+)\|0\|4$ ]] || (( ${BASH_REMATCH[1]:-0} < 6 )); then
    echo 'Unexpected saved-session count, pending AI work or migration state; DB remains available for review.' >&2
    exit 1
  fi

  echo '=== EXPORTING PRIVATE DATABASE ARCHIVE ==='
  test "$(df -Pk /home | awk 'NR==2 {print $4}')" -ge 262144
  dir="$HOME/ami-108-backups"
  mkdir -p "$dir"
  chmod 700 "$dir"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
  file="$dir/pause-ami108-$stamp.dump"
  envcopy="$dir/.env-pause-$stamp"
  statusfile="$dir/pause-ami108-$stamp.status"
  test ! -e "$file"
  test ! -e "$envcopy"
  tmp=$(mktemp "$dir/.pause-XXXXXXXX.dump")
  docker compose exec -T db sh -ec \
    'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$tmp"
  test -s "$tmp"
  docker compose exec -T db pg_restore --list < "$tmp" > /dev/null
  docker compose exec -T db pg_restore --file=/dev/null < "$tmp"
  mv -- "$tmp" "$file"
  sha256sum "$file" > "$file.sha256"
  (cd "$dir" && sha256sum -c "$(basename "$file").sha256")

  cp -p -- .env "$envcopy"
  chmod 600 "$envcopy"

  after=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_AFTER=$after"
  test "$before" = "$after"
  test "$db_id" = "$(docker inspect --format '{{.Id}}' ami-108-db-1)"

  printf 'Local runtime: %s\nSessions|Pending|Migrations: %s\nBackup: %s\nSHA256: %s\n' \
    "$(git rev-parse HEAD)" "$after" "$(basename "$file")" "$(sha256sum "$file" | awk '{print $1}')" > "$statusfile"
  chmod 600 "$statusfile"

  echo '=== STOPPING DB, AI AND RESIDENT OLLAMA WITHOUT DELETING VOLUMES ==='
  docker compose stop ai db
  docker stop -t 30 ami108-local-ollama

  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Running}}' "ami-108-$service-1")" = false
  done
  test "$(docker inspect --format '{{.State.Running}}' ami108-local-ollama)" = false

  echo '=== SAFE PAUSE REPORT (NO SECRETS) ==='
  echo "SESSIONS|PENDING|MIGRATIONS=$after"
  echo "BACKUP_FILE=$(basename "$file")"
  echo "BACKUP_BYTES=$(stat -c '%s' "$file")"
  echo "BACKUP_SHA256=PASS"
  echo 'PRIVATE_ENV_COPY=PRESENT (contents withheld)'
  docker compose ps -a
  df -h / /home
  completed=1
  echo '=== SAFE PAUSE COMPLETE ==='
)
