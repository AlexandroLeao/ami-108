#!/usr/bin/env bash
# Owner-run final opt-in for verified resident, private Ollama on Cloud Shell.
# Changes ONLY the local untracked .env generation switch and recreates API.
# Does not restore DB, recreate Web/AI/DB, rebuild images, or change gameplay.
(
  set -euo pipefail
  cd "${AMI108_REPO:-$HOME/ami-108}"
  umask 077
  set +x

  previous_env=''
  modified_env=0
  recreate_attempted=0
  restore_on_error() {
    status=$?
    trap - EXIT
    if (( status != 0 )); then
      echo "=== ACTIVATION FAILED — ATTEMPTING SAFE API-ONLY ROLLBACK ===" >&2
      if (( modified_env == 1 )) && [[ -f "$previous_env" ]]; then
        cp -p "$previous_env" .env || true
        chmod 600 .env || true
      fi
      if (( recreate_attempted == 1 )); then
        env AMI_AI_GENERATION=0 docker compose up -d --no-deps --no-build --force-recreate --wait api ||
          echo "API rollback incomplete; DO NOT play or change DB. Review status before next action." >&2
      fi
      echo "Activation was not certified; inspect the output. Do not rerun blindly." >&2
    fi
    exit "$status"
  }
  trap restore_on_error EXIT

  echo "=== VERIFY APPROVED RUNTIME AND PRIVATE CONFIG ==="
  test "$(git branch --show-current)" = main
  test "$(git rev-parse HEAD)" = 14ea583a83c7c1473bc94f3b1d515a8497827ac3
  test -z "$(git status --porcelain)"
  test -f .env
  git check-ignore -q .env
  test $(( 8#$(stat -c '%a' .env) & 8#077 )) -eq 0

  # Never trust inherited shell overrides: the future Compose effective value
  # must come from the protected, untracked .env.
  unset AMI_AI_GENERATION
  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$service-1")" = healthy
  done
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "0") process.exit(1);
    console.log("CURRENT_GAME_GENERATION=OFF");
  '
  docker compose exec -T ai /app/.venv/bin/python - <<'PY'
import os
assert os.environ.get("AMI_AI_PROVIDER") == "ollama"
assert os.environ.get("AMI_OLLAMA_MODEL") == "qwen2.5:1.5b"
assert os.environ.get("AMI_OLLAMA_URL") == "http://ollama:11434"
assert os.environ.get("AMI_OLLAMA_KEEP_ALIVE") == "-1"
assert len(os.environ.get("AMI_AI_INTERNAL_TOKEN", "")) >= 32
print("LOCAL_AI_CONFIGURATION=VERIFIED (secret withheld)")
PY
  server=ami108-local-ollama
  network=ami108-local-inference
  image=ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592
  test "$(docker inspect --format '{{.State.Running}}' "$server")" = true
  test "$(docker inspect --format '{{.HostConfig.Memory}}' "$server")" = 3221225472
  test "$(docker inspect --format '{{.Image}}' "$server")" = "$(docker image inspect --format '{{.Id}}' "$image")"
  test "$(docker network inspect --format '{{.Internal}}' "$network")" = true
  test "$(docker inspect --format '{{len .NetworkSettings.Networks}}' "$server")" = 1
  test -z "$(docker port "$server")"
  docker inspect --format '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$server" |
    grep -Fxq "$network"
  docker inspect --format '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' ami-108-ai-1 |
    grep -Fxq "$network"
  docker exec "$server" ollama list | grep -Fq 65ec06548149
  docker exec "$server" ollama ps | grep -E 'qwen2\.5:1\.5b.*Forever'

  counts() {
    docker compose exec -T db sh -ec \
      'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\") || chr(124) || (SELECT count(*) FROM \"GamePendingGeneration\") || chr(124) || (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL);"'
  }
  dbid=$(docker inspect --format '{{.Id}}' ami-108-db-1)
  before=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_BEFORE=$before"
  test "$before" = "6|0|4"
  test "$(df -Pk /home | awk 'NR==2 {print $4}')" -ge 262144

  echo "=== PRIVATE ENV BACKUP; ENABLE ONLY API GENERATION ==="
  dir="$HOME/ami-108-backups"
  mkdir -p "$dir"
  chmod 700 "$dir"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
  previous_env="$dir/.env-before-game-ai-$stamp"
  test ! -e "$previous_env"
  cp -p .env "$previous_env"
  chmod 600 "$previous_env"
  modified_env=1
  python3 - .env <<'PY'
import os, stat, sys, tempfile
from pathlib import Path
p = Path(sys.argv[1])
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
matches = [i for i, line in enumerate(lines) if line.startswith("AMI_AI_GENERATION=")]
if len(matches) > 1:
    raise RuntimeError("Ambiguous duplicate AMI_AI_GENERATION values in private config")
if matches:
    i = matches[0]
    eol = "\r\n" if lines[i].endswith("\r\n") else "\n"
    lines[i] = "AMI_AI_GENERATION=1" + eol
else:
    if lines and not lines[-1].endswith("\n"):
        lines.append("\n")
    lines.append("AMI_AI_GENERATION=1\n")
fd, temp = tempfile.mkstemp(prefix=".ami108-activate-", dir=p.parent)
try:
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        handle.write("".join(lines))
    os.chmod(temp, stat.S_IMODE(p.stat().st_mode))
    os.replace(temp, p)
finally:
    if os.path.exists(temp):
        os.unlink(temp)
print("PRIVATE_GENERATION_SWITCH=1 (other config values withheld)")
PY
  test $(( 8#$(stat -c '%a' .env) & 8#077 )) -eq 0

  # API only. No rebuild. The unchanged four migrations may be checked at API
  # startup but no schema or player state is recreated.
  echo "=== RECREATING ONLY API WITH MODEL GENERATION ENABLED ==="
  recreate_attempted=1
  docker compose up -d --no-deps --no-build --force-recreate --wait api
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "1") process.exit(1);
    if (!process.env.AMI_AI_INTERNAL_TOKEN) process.exit(1);
    console.log("CURRENT_GAME_GENERATION=ON");
  '
  for url in http://localhost:3000/health http://localhost:3001/health/ready http://localhost:8000/health; do
    curl -fsS -o /dev/null "$url"
    echo "$url OK"
  done
  after=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_AFTER=$after"
  test "$after" = "$before"
  test "$(docker inspect --format '{{.Id}}' ami-108-db-1)" = "$dbid"
  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$service-1")" = healthy
  done
  docker exec "$server" ollama ps | grep -E 'qwen2\.5:1\.5b.*Forever'
  echo "=== LIVE IN-GAME AI ENABLED — ALL SIX SAVES INTACT ==="
)
