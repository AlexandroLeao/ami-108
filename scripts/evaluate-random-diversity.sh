#!/usr/bin/env bash
# Isolated RANDOM variety measurement; never run against the game database.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = 119bd82
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
  echo '=== RANDOM diversity: six fresh requests per context and language ==='
  docker run --rm -i --network "$net" \
    -e AMI_AI_PROVIDER=ollama \
    -e AMI_OLLAMA_URL=http://ollama:11434 \
    -e AMI_OLLAMA_MODEL=qwen2.5:1.5b \
    "$image" /app/.venv/bin/python -u - <<'PYTHON'
import asyncio
import json
import time
from collections import Counter
from uuid import uuid4
from app.generation import GenerationRequest, generate, retrieve
from app.ollama_provider import local_provider

async def main():
    provider = local_provider()
    if provider is None:
        raise SystemExit("Provider unavailable")
    cases = {
        "INTRO-RANDOM": ["INTRO-OCTOPUS", "INTRO-PENGUIN"],
        "Q-DOG": ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"],
        "Q-RAT": ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"],
    }
    combined = {question: Counter() for question in cases}
    valid = 0
    for question, facts in cases.items():
        for locale in ("pt-BR", "en"):
            counts = Counter()
            reasons = Counter()
            for sample in range(1, 7):
                request = GenerationRequest(requestId=str(uuid4()), questionId=question,
                    category="RANDOM", locale=locale, factIds=facts, deadlineMs=2500)
                context = retrieve(request)
                if context is None:
                    raise RuntimeError("Missing authorized context")
                start = time.monotonic()
                result = await generate(request, provider)
                elapsed = round((time.monotonic()-start)*1000)
                if result.status == "VALIDATED":
                    idx = (context.approved_text, *context.alternatives).index(result.text)
                    variant = facts[idx]
                    counts[variant] += 1
                    combined[question][variant] += 1
                    valid += 1
                else:
                    variant = None
                    reasons[result.reason] += 1
                print(json.dumps({"question":question,"locale":locale,"sample":sample,
                    "status":result.status,"variant":variant,"elapsedMs":elapsed,
                    "reason":getattr(result,"reason",None)}))
            print(json.dumps({"summary":question,"locale":locale,"validated":sum(counts.values()),
                "distinct":len(counts),"available":len(facts),"variants":dict(counts),
                "fallbackReasons":dict(reasons)}))
    for question, counts in combined.items():
        print(json.dumps({"combined":question,"distinct":len(counts),
            "available":len(cases[question]),"variants":dict(counts)}))
    print(json.dumps({"validated":valid,"total":36}))
    if valid == 0:
        raise SystemExit("No validated real output")
asyncio.run(main())
PYTHON
  echo '=== DIVERSITY AUDIT COMPLETE ==='
)
