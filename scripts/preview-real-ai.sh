#!/usr/bin/env bash
# Owner-only browser preview; never use the accepted database or port 3000.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = af212f0
  test -z "$(git status --porcelain)"
  git fetch origin feat/ai-rag-foundation
  candidate=47c7621e473abc5ee0b89db0f259ebbd3729a1c3
  git cat-file -e "$candidate^{commit}"
  worktree=$(mktemp -d /tmp/ami108-eval.XXXXXX)
  tag="ami108-eval-$(printf '%s' "${worktree##*.}" | LC_ALL=C tr '[:upper:]' '[:lower:]')"
  net="$tag-net"
  previewnet="$tag-preview"
  port=3002
  server="$tag-ollama"
  volume="$tag-models"
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
    docker rm -f "$server" >/dev/null 2>&1 || true
    docker network rm "$previewnet" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
    docker volume rm "$volume" >/dev/null 2>&1 || true
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
  docker build -f "$worktree/infra/node.Dockerfile" --target web -t "$webimage" "$worktree"
  docker pull postgres:17-alpine
  docker pull ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592
  ollama_image=$(docker image inspect --format '{{.Id}}' ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592)
  printf 'Candidate: %s\nOllama image: %s\n' "$candidate" "$ollama_image"
  docker image inspect --format '{{json .RepoDigests}}' "$ollama_image"
  docker volume create "$volume"
  docker network create --internal "$net"
  docker run -d --name "$server" --network bridge \
    -e OLLAMA_NO_CLOUD=1 -e OLLAMA_HOST=0.0.0.0:11434 \
    -e OLLAMA_NUM_PARALLEL=1 -e OLLAMA_MAX_LOADED_MODELS=1 \
    -v "$volume:/root/.ollama" "$ollama_image"
  ready=0
  for i in $(seq 1 30); do
    if docker exec "$server" ollama list >/dev/null 2>&1; then
      ready=1; break
    fi
    sleep 2
  done
  test "$ready" = 1
  docker logs "$server" 2>&1 | grep -i 'cloud disabled: true'
  docker exec "$server" ollama --version
  docker exec "$server" ollama pull qwen2.5:1.5b
  docker exec "$server" ollama list
  docker network connect --alias ollama "$net" "$server"
  docker network disconnect bridge "$server"
  docker inspect --format '{{json .NetworkSettings.Networks}}' "$server"
  docker network inspect --format '{{.Internal}}' "$net"
  # Everything below uses only the newly created internal network and volume.
  docker volume create "$dbvolume"
  password=$(openssl rand -hex 24)
  token=$(openssl rand -hex 32)
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
  docker run -d --name "$ai" --network "$net" --network-alias ai \
    -e AMI_AI_INTERNAL_TOKEN="$token" -e AMI_AI_PROVIDER=ollama \
    -e AMI_OLLAMA_URL=http://ollama:11434 -e AMI_OLLAMA_MODEL=qwen2.5:1.5b "$image"
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
  docker run --rm -i --network "$net" "$image" /app/.venv/bin/python -u - <<'PYTHON'
import http.client
import json
import time
started = time.monotonic()
conn = http.client.HTTPConnection("ollama", 11434, timeout=90)
try:
    body = {"model": "qwen2.5:1.5b", "prompt": "Reply with the single digit 0.",
            "stream": False, "keep_alive": "30m", "options": {"temperature": 0, "num_predict": 4}}
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
  echo 'Start a NEW game in the preview. The original game at port 3000 is unchanged.'
  echo 'After playtest, return here and press ENTER to print anonymized results and remove ONLY preview resources.'
  read -r _
  echo '=== Preview generation audit (no cookies, identifiers or dialogue) ==='
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c 'SELECT "generationStatus", "generationReason", count(*) FROM "GameCommandReceipt" WHERE "generationStatus" IS NOT NULL GROUP BY 1,2 ORDER BY 1,2;'
  docker exec "$db" psql -v ON_ERROR_STOP=1 -U ami_test -d ami_test -c 'SELECT "encounterId", category, count(*) FROM "GameConsultationSlot" GROUP BY 1,2 ORDER BY 1,2;'
  echo '=== Accepted stack (read-only) ==='
  docker compose ps
  docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM \"GameSession\";"'
)
