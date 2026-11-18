#!/usr/bin/env bash
# Isolated manual benchmark; never run against the game database.
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
  server="$tag-ollama"
  volume="$tag-models"
  image="$tag-ai"
  cleanup() {
    docker rm -f "$server" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
    docker volume rm "$volume" >/dev/null 2>&1 || true
    git worktree remove "$worktree" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
  git worktree add --detach "$worktree" "$candidate"
  docker build -t "$image" "$worktree/services/ai"
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
  echo '=== Warmup only: outside gameplay timing ==='
  docker run --rm -i --network "$net" "$image" /app/.venv/bin/python -u - <<'PYTHON'
import http.client
import json
import time
started = time.monotonic()
conn = http.client.HTTPConnection("ollama", 11434, timeout=90)
try:
    body = {"model": "qwen2.5:1.5b", "prompt": "Reply with the single digit 0.",
            "stream": False, "keep_alive": "5m", "options": {"temperature": 0, "num_predict": 4}}
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
  evaluate() {
    docker run --rm --network "$net" \
      -e AMI_AI_PROVIDER=ollama \
      -e AMI_OLLAMA_URL=http://ollama:11434 \
      -e AMI_OLLAMA_MODEL=qwen2.5:1.5b \
      "$image" /app/.venv/bin/python -m app.evaluate_local
  }
  status=0
  echo 'PASS 1 (warm, strict runtime deadlines)'
  evaluate || status=1
  echo 'PASS 2 (repeat, strict runtime deadlines)'
  evaluate || status=1
  exit "$status"
)
