#!/usr/bin/env bash
# Read-only measurements for a RESUMED private AMI-108 Cloud Shell VM.
# Does not start, stop, restore, migrate, rebuild, create games, or call AI generation.
(
  set -euo pipefail
  set +x
  cd "${AMI108_REPO:-$HOME/ami-108}"
  echo '=== AMI-108 RESUMED READ-ONLY QA METRICS ==='
  test "$(git branch --show-current)" = main
  test "$(git rev-parse HEAD)" = 14ea583a83c7c1473bc94f3b1d515a8497827ac3
  test -z "$(git status --porcelain)"
  test -f .env
  git check-ignore -q .env
  test $((8#$(stat -c '%a' .env) & 8#077)) -eq 0
  for svc in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$svc-1")" = healthy
  done
  test "$(docker inspect --format '{{.State.Running}}' ami108-local-ollama)" = true
  test -z "$(docker port ami108-local-ollama)"
  test "$(docker network inspect --format '{{.Internal}}' ami108-local-inference)" = true
  test "$(docker inspect --format '{{len .NetworkSettings.Networks}}' ami108-local-ollama)" = 1
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "1") process.exit(1);
    console.log("LOCAL_GAME_AI=ON (no token shown)");
  '
  echo '=== SAVED DATA — READ ONLY ==='
  result=$(docker compose exec -T db sh -ec \
    'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\") || chr(124) || (SELECT count(*) FROM \"GamePendingGeneration\") || chr(124) || (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL);"')
  echo "SESSIONS|PENDING|MIGRATIONS=$result"
  if [[ ! "$result" =~ ^([0-9]+)\|0\|4$ ]] || (( ${BASH_REMATCH[1]:-0} < 7 )); then
    echo 'Unexpected saved data; stop further checks and review without writes' >&2
    exit 1
  fi

  echo '=== READINESS HTTP TIMINGS (NO GAME COMMANDS) ==='
  for url in http://127.0.0.1:3000/health http://127.0.0.1:3001/health/ready http://127.0.0.1:8000/health; do
    echo "$url"
    for i in 1 2 3 4 5; do
      curl --silent --show-error --fail --max-time 5 --output /dev/null \
        --write-out "sample=$i http=%{http_code} seconds=%{time_total}\n" "$url"
    done
  done

  echo '=== CONTAINER RESOURCE SNAPSHOT (NOT PUBLIC CAPACITY PROOF) ==='
  docker stats --no-stream --format '{{.Name}} CPU={{.CPUPerc}} MEM={{.MemUsage}}' \
    ami-108-db-1 ami-108-api-1 ami-108-ai-1 ami-108-web-1 ami108-local-ollama
  echo '=== RESIDENT MODEL ==='
  docker exec ami108-local-ollama ollama ps
  echo '=== DISK ==='
  df -h / /home
  echo '=== READ-ONLY METRICS COMPLETE; NO SAVES ALTERED BY THIS SCRIPT ==='
)
