#!/usr/bin/env bash
# Owner-only browser preview; never use the accepted database or port 3000.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = 9b76771
  test -z "$(git status --porcelain)"
  git fetch origin feat/content-warning
  candidate="${1:?Pass the exact CI-approved candidate SHA}"
  test "$(git rev-parse origin/feat/content-warning)" = "$candidate"
  git merge-base --is-ancestor HEAD "$candidate"
  git cat-file -e "$candidate^{commit}"
  worktree=$(mktemp -d /tmp/ami108-warning.XXXXXX)
  tag="ami108-warning-$(printf '%s' "${worktree##*.}" | LC_ALL=C tr '[:upper:]' '[:lower:]')"
  net="$tag-net"
  previewnet="$tag-preview"
  port=3002
  image="$tag-ai"
  db="$tag-db"
  ai="$tag-service"
  api="$tag-api"
  web="$tag-web"
  dbvolume="$tag-dbdata"
  apiimage="$tag-api-image"
  webimage="$tag-web-image"
  cleanup() {
    docker rm -f "$web" "$api" "$ai" "$db" >/dev/null 2>&1 || true
    docker volume rm "$dbvolume" >/dev/null 2>&1 || true
    docker network rm "$previewnet" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
    docker image rm "$webimage" >/dev/null 2>&1 || true
    git worktree remove "$worktree" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  if ss -H -ltn "sport = :$port" | grep -q .; then
    echo "Port $port is occupied; aborting without changing existing containers."
    exit 1
  fi
  git worktree add --detach "$worktree" "$candidate"
  df -h /
  test "$(df -Pk / | awk 'NR==2 {print $4}')" -ge 10485760 || { echo 'Less than 10 GiB free; aborting before builds.'; exit 1; }
  # Candidate changes only web; reuse the running accepted API/AI image IDs, not their containers or data.
  apiimage=$(docker inspect --format '{{.Image}}' ami-108-api-1)
  image=$(docker inspect --format '{{.Image}}' ami-108-ai-1)
  test "$(docker inspect --format '{{.State.Health.Status}}' ami-108-api-1)" = healthy
  test "$(docker inspect --format '{{.State.Health.Status}}' ami-108-ai-1)" = healthy
  docker build -f "$worktree/infra/node.Dockerfile" --target web -t "$webimage" "$worktree"
  docker pull postgres:17-alpine
  printf 'Candidate: %s\n' "$candidate"
  docker network create --internal "$net"
  # Everything below uses only the newly created internal network and volume.
  docker volume create "$dbvolume"
  password=$(openssl rand -hex 24)
  database="postgresql://ami_test:$password@db:5432/ami_test?schema=public"
  docker run -d --name "$db" --network "$net" --network-alias db \
    -e POSTGRES_USER=ami_test -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=ami_test \
    -v "$dbvolume:/var/lib/postgresql/data" postgres:17-alpine
  ready=0
  for i in $(seq 1 60); do
    if docker exec "$db" pg_isready -h 127.0.0.1 -U ami_test -d ami_test >/dev/null 2>&1; then ready=1; break; fi
    sleep 1
  done
  test "$ready" = 1
  docker run -d --name "$ai" --network "$net" --network-alias ai "$image"
  docker run -d --name "$api" --network "$net" --network-alias api \
    -e DATABASE_URL="$database" -e AMI_AI_GENERATION=0 \
    -e AI_SERVICE_URL=http://ai:8000 -e AMI_DEV_PREVIEW=1 "$apiimage"
  docker network create "$previewnet"
  docker run -d --name "$web" --network "$previewnet" -p "127.0.0.1:$port:3000" \
    -e API_URL=http://api:3001 -e AMI_DEV_PREVIEW=1 "$webimage"
  docker network connect --alias web "$net" "$web"
  wait_stack() {
    local ready=0
    for i in $(seq 1 90); do
      if docker exec "$api" node -e 'Promise.all(["http://localhost:3001/health/ready","http://ai:8000/health","http://web:3000/health"].map(async u=>{if(!(await fetch(u,{signal:AbortSignal.timeout(1000)})).ok)throw Error("not ready")})).catch(()=>process.exit(1))' >/dev/null 2>&1; then ready=1; break; fi
      sleep 2
    done
    test "$ready" = 1
  }
  wait_stack
  curl --fail --silent --show-error "http://127.0.0.1:$port/health" >/dev/null
  echo '=== CONTENT WARNING PREVIEW READY: port 3002, isolated new game ==='
  echo 'Keep this terminal open. Open Cloud Shell Web Preview, change port to 3002.'
  echo 'Test New game -> warning -> Back (no session), then Continue -> Chapter 1. Test Extras and both languages. The original game at port 3000 is unchanged.'
  echo 'After playtest, return here and press ENTER to print anonymized results and remove ONLY preview resources.'
  read -r _
  echo '=== Content warning preview audit (no cookies, identifiers or dialogue) ==='
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c "SELECT state->>'stepId' AS step, state->'diagnostics'->>'personalUnlocked' AS personal_unlocked, count(*) FROM \"GameSession\" GROUP BY 1,2 ORDER BY 1,2;"
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c 'SELECT "encounterId", category, count(*) FROM "GameConsultationSlot" GROUP BY 1,2 ORDER BY 1,2;'
  echo '=== Accepted stack (read-only) ==='
  docker compose ps
  if docker compose ps --status running --services | grep -qx db; then
  docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM \"GameSession\";"'
  else
    echo 'Accepted DB is stopped; no changes made.'
  fi
)
