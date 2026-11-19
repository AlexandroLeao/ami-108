#!/usr/bin/env bash
# RANDOM diversity and resident model preview; disposable database, shared local model only.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = f89c342
  test -z "$(git status --porcelain)"
  candidate=${1:?Pass the reviewed exact candidate SHA}
  [[ "$candidate" =~ ^[0-9a-f]{40}$ ]]
  git fetch origin fix/random-consultation-variety
  test "$(git rev-parse FETCH_HEAD)" = "$candidate"
  git cat-file -e "$candidate^{commit}"
  worktree=$(mktemp -d /tmp/ami108-eval.XXXXXX)
  tag="ami108-eval-$(printf '%s' "${worktree##*.}" | LC_ALL=C tr '[:upper:]' '[:lower:]')"
  net="$tag-net"
  previewnet="$tag-preview"
  port=3002
  modelnet=ami108-local-inference
  server=ami108-local-ollama
  image="$tag-ai"
  db="$tag-db"
  ai="$tag-service"
  api="$tag-api"
  web="$tag-web"
  dbvolume="$tag-dbdata"
  apiimage="$tag-api-image"
  webimage=$(docker inspect --format '{{.Image}}' ami-108-web-1)
  cleanup() {
    docker rm -f "$web" "$api" "$ai" "$db" >/dev/null 2>&1 || true
    docker volume rm "$dbvolume" >/dev/null 2>&1 || true
    docker network rm "$previewnet" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
    docker image rm "$image" "$apiimage" >/dev/null 2>&1 || true
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
  docker build -t "$image" "$worktree/services/ai"
  docker build -f "$worktree/infra/node.Dockerfile" --target api -t "$apiimage" "$worktree"
  dbimage=$(docker inspect --format '{{.Image}}' ami-108-db-1)
  test "$(docker network inspect --format '{{.Internal}}' "$modelnet")" = true
  test "$(docker inspect --format '{{.State.Running}}' "$server")" = true
  test "$(docker inspect --format '{{.Image}}' "$server")" = "$(docker image inspect --format '{{.Id}}' ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592)"
  test -z "$(docker port "$server")"
  test "$(docker inspect --format '{{.HostConfig.Memory}}' "$server")" = 3221225472
  docker exec "$server" ollama list | grep -F 65ec06548149
  docker network create --internal "$net"
  # Only preview AI joins the existing model network. Preview DB/API remain on their own network.
  docker volume create "$dbvolume"
  password=$(openssl rand -hex 24)
  token=$(openssl rand -hex 32)
  database="postgresql://ami_test:$password@db:5432/ami_test?schema=public"
  docker run -d --name "$db" --network "$net" --network-alias db \
    -e POSTGRES_USER=ami_test -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=ami_test \
    -v "$dbvolume:/var/lib/postgresql/data" "$dbimage"
  ready=0
  for i in $(seq 1 60); do
    if docker exec "$db" pg_isready -h 127.0.0.1 -U ami_test -d ami_test >/dev/null 2>&1; then ready=1; break; fi
    sleep 1
  done
  test "$ready" = 1
  docker run -d --name "$ai" --network "$net" --network-alias ai \
    -e AMI_AI_INTERNAL_TOKEN="$token" -e AMI_AI_PROVIDER=ollama \
    -e AMI_OLLAMA_URL=http://ollama:11434 -e AMI_OLLAMA_MODEL=qwen2.5:1.5b \
    -e AMI_OLLAMA_KEEP_ALIVE=-1 "$image"
  docker network connect "$modelnet" "$ai"
  docker run -d --name "$api" --network "$net" --network-alias api \
    -e DATABASE_URL="$database" -e AMI_AI_GENERATION=1 -e AMI_AI_INTERNAL_TOKEN="$token" \
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
  echo '=== Warmup only: outside gameplay timing ==='
  docker run --rm -i --network "$modelnet" "$image" /app/.venv/bin/python -u - <<'PYTHON'
import http.client
import json
import time
started = time.monotonic()
conn = http.client.HTTPConnection("ollama", 11434, timeout=90)
try:
    body = {"model": "qwen2.5:1.5b", "prompt": "Reply with the single digit 0.",
            "stream": False, "keep_alive": -1, "options": {"temperature": 0, "num_predict": 4}}
    conn.request("POST", "/api/generate", json.dumps(body), {"Content-Type": "application/json"})
    response = conn.getresponse()
    if response.status != 200:
        raise RuntimeError("Warmup failed")
    result = json.loads(response.read(16385))
    if result.get("done") is not True:
        raise RuntimeError("Warmup incomplete")
    print(json.dumps({"phase": "warmup", "elapsedMs": round((time.monotonic()-started)*1000)}))
finally:
    conn.close()
PYTHON
  curl --fail --silent --show-error "http://127.0.0.1:$port/health" >/dev/null
  echo '=== PREVIEW READY: port 3002, isolated new game ==='
  echo 'Keep this terminal open. Open Cloud Shell Web Preview, change port to 3002.'
  docker exec "$server" ollama ps
  echo 'Start a NEW game in the preview. Keep port 3000 closed while testing to avoid model contention.'
  echo 'Check intro, all three consultations in DOG/RAT where possible, then retry cached slots. Include a gap longer than five minutes before a new consultation if convenient.'
  echo 'After playtest, return here and press ENTER to print anonymized results and remove ONLY preview resources.'
  read -r _
  echo '=== Model residency after playtest ==='
  docker exec "$server" ollama ps
  echo '=== Preview generation audit (no cookies, identifiers or dialogue) ==='
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c 'SELECT "generationStatus", "generationReason", count(*) FROM "GameCommandReceipt" WHERE "generationStatus" IS NOT NULL GROUP BY 1,2 ORDER BY 1,2;'
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c 'SELECT "encounterId", category, count(*) FROM "GameConsultationSlot" GROUP BY 1,2 ORDER BY 1,2;'
  echo '=== Persisted RANDOM variety (aggregate only) ==='
  audit_status=0
  docker exec -i "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test <<'SQL' || audit_status=1
SELECT "encounterId", count(*) AS slots, count(DISTINCT "localizedText") AS variants,
       count(*) FILTER (WHERE recipe) AS recipe_slots
FROM "GameConsultationSlot"
WHERE category = 'RANDOM'
GROUP BY 1 ORDER BY 1;
SELECT count(*) AS introductions, count(DISTINCT state->'intro'->'text') AS variants
FROM "GameSession" WHERE state->'intro'->'text' IS NOT NULL;
SQL
  if [ "$audit_status" -ne 0 ]; then
    echo 'Distinct-slot audit failed; gameplay acceptance and other results must be assessed separately.' >&2
  fi
  echo '=== Accepted stack (read-only) ==='
  docker compose ps
  docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM \"GameSession\";"'
  exit "$audit_status"
)
