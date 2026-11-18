#!/usr/bin/env bash
# Isolated manual benchmark; never run against the game database.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = af212f0
  test -z "$(git status --porcelain)"
  git fetch origin feat/ai-rag-foundation
  candidate=7d9ef512a92ede0e99c5418e0ddcc3fec9774a01
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
  echo '=== DIAGNOSTIC ONLY: no gameplay deadline change ==='
  nproc
  docker run --rm -i --network "$net" \
    -e AMI_AI_PROVIDER=ollama \
    -e AMI_OLLAMA_URL=http://ollama:11434 \
    -e AMI_OLLAMA_MODEL=qwen2.5:1.5b \
    "$image" /app/.venv/bin/python -u - <<'PYTHON'
import asyncio
import http.client
import json
import time
from dataclasses import replace
from uuid import uuid4

from app.generation import GenerationRequest, generate, retrieve
from app.ollama_provider import OllamaProvider, local_provider

MODEL = "qwen2.5:1.5b"
CASES = [
    ("INTRO-RANDOM", "RANDOM", ["INTRO-OCTOPUS", "INTRO-PENGUIN"]),
    ("Q-DOG", "CORRECT", ["DOG-VISION", "DOG-HEARING", "DOG-WAIT"]),
    ("Q-DOG", "RANDOM", ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY"]),
    ("Q-RAT", "CORRECT", ["RAT-LIGHT", "RAT-CONTAINMENT"]),
    ("Q-RAT", "RANDOM", ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN"]),
]

def call(body, timeout):
    conn = http.client.HTTPConnection("ollama", 11434, timeout=timeout)
    try:
        conn.request("POST", "/api/generate", json.dumps(body).encode(), {"Content-Type": "application/json"})
        response = conn.getresponse()
        if response.status != 200:
            raise RuntimeError("HTTP " + str(response.status))
        result = json.loads(response.read(16385))
        if result.get("done") is not True:
            raise RuntimeError("Incomplete response")
        return result
    finally:
        conn.close()

def metrics(result):
    return {key: round(result[key] / 1_000_000) for key in
            ("total_duration", "load_duration", "prompt_eval_duration", "eval_duration")
            if isinstance(result.get(key), (int, float))}

class IndexProvider:
    def __init__(self):
        self.last_metrics = {}

    async def generate(self, context):
        options = (context.approved_text, *context.alternatives)
        self.last_metrics = {}
        result = await asyncio.to_thread(call, {
            "model": MODEL, "stream": False, "keep_alive": "5m",
            "system": "Select one allowed option. Output only its numeric index. No explanation.",
            "prompt": json.dumps({"locale": context.locale, "category": context.category,
                                  "options": {str(i): text for i, text in enumerate(options)}},
                                 ensure_ascii=False),
            "options": {"temperature": 0.5, "num_predict": 4},
        }, 28)
        self.last_metrics = metrics(result)
        raw = result.get("response")
        if not isinstance(raw, str) or raw.strip() not in {str(i) for i in range(len(options))}:
            return ""  # Existing validator rejects the invalid output.
        return options[int(raw.strip())]

async def main():
    provider = local_provider()
    if not isinstance(provider, OllamaProvider):
        raise SystemExit("Local provider not configured")
    start = time.monotonic()
    warm = await asyncio.to_thread(call, {
        "model": MODEL, "prompt": "Reply with the single digit 0.",
        "stream": False, "keep_alive": "5m",
        "options": {"temperature": 0, "num_predict": 4},
    }, 90)
    print(json.dumps({"phase": "warmup", "elapsedMs": round((time.monotonic()-start)*1000),
                      "serverMs": metrics(warm)}), flush=True)
    full = replace(provider, timeout_seconds=28)
    short = IndexProvider()
    totals = {"full": 0, "index": 0, "indexWithin2000ms": 0, "indexAlternatives": 0}
    for locale in ("pt-BR", "en"):
        for question, category, facts in CASES:
            request = GenerationRequest(requestId=str(uuid4()), questionId=question, category=category,
                                        locale=locale, factIds=facts, deadlineMs=30000)
            context = retrieve(request)
            assert context is not None
            modes = [("index", short)]
            if question == "Q-DOG" and category == "CORRECT":
                modes.insert(0, ("full", full))
            for mode, selected in modes:
                start = time.monotonic()
                result = await generate(request, selected)
                elapsed = round((time.monotonic()-start)*1000)
                valid = result.status == "VALIDATED"
                alternative = valid and result.text != context.approved_text
                totals[mode] += int(valid)
                if mode == "index":
                    totals["indexWithin2000ms"] += int(valid and elapsed <= 2000)
                    totals["indexAlternatives"] += int(alternative)
                print(json.dumps({"phase": mode, "question": question, "category": category,
                                  "locale": locale, "status": result.status, "elapsedMs": elapsed,
                                  "reason": getattr(result, "reason", None), "alternative": alternative,
                                  "serverMs": short.last_metrics if mode == "index" else {}}), flush=True)
                # A timed-out request may still be running on the server; stop rather than
                # contaminating the next measurement with an unknown queued request.
                if getattr(result, "reason", None) == "TIMEOUT":
                    print(json.dumps({"summary": totals, "aborted": "timeout; remaining cases unmeasured"}), flush=True)
                    raise SystemExit(1)
    print(json.dumps({"summary": totals, "fullTotal": 2, "indexTotal": 10}), flush=True)

asyncio.run(main())
PYTHON
)
