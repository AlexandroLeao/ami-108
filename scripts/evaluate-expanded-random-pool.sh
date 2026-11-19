#!/usr/bin/env bash
# Owner-only, read-only game audit and isolated candidate against the existing local model.
(
  set -euo pipefail
  cd ~/ami-108
  test "$(git branch --show-current)" = main
  test "$(git rev-parse --short HEAD)" = f9c89c9
  test -z "$(git status --porcelain)"
  echo '=== Saved categories (no identifiers or text) ==='
  docker compose exec -T db sh -ec 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
SELECT "encounterId", "slotIndex", category, count(*) AS slots
FROM "GameConsultationSlot"
GROUP BY 1,2,3 ORDER BY 1,2,3;
SELECT "encounterId", category, count(*) AS slots,
       count(DISTINCT "localizedText") AS distinct_texts
FROM "GameConsultationSlot" GROUP BY 1,2 ORDER BY 1,2;
SELECT "generationStatus", "generationReason", count(*)
FROM "GameCommandReceipt" WHERE "generationStatus" IS NOT NULL GROUP BY 1,2 ORDER BY 1,2;
SELECT count(*) AS sessions FROM "GameSession";
SQL
  echo '=== Live API inference configuration ==='
  docker compose exec -T api node -e 'console.log(JSON.stringify({generationEnabled:process.env.AMI_AI_GENERATION==="1",internalTokenConfigured:!!process.env.AMI_AI_INTERNAL_TOKEN,serviceConfigured:!!process.env.AI_SERVICE_URL}))'
  echo '=== Candidate evaluation: no game database or service updates ==='
  net=ami108-local-inference
  model=ami108-local-ollama
  test "$(docker network inspect --format '{{.Internal}}' "$net")" = true
  test "$(docker inspect --format '{{.State.Running}}' "$model")" = true
  test "$(docker inspect --format '{{.Image}}' "$model")" = "$(docker image inspect --format '{{.Id}}' ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592)"
  docker exec "$model" ollama list | grep -F 65ec06548149
  git fetch origin feat/expanded-random-pool
  candidate=164bb538a409d0cf13726d6d1bdf8011634f3562
  git cat-file -e "$candidate^{commit}"
  worktree=$(mktemp -d /tmp/ami108-expanded.XXXXXX)
  image="ami108-expanded-$(printf '%s' "${worktree##*.}" | LC_ALL=C tr '[:upper:]' '[:lower:]'):test"
  cleanup() {
    docker image rm "$image" >/dev/null 2>&1 || true
    git worktree remove "$worktree" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  git worktree add --detach "$worktree" "$candidate"
  docker build -t "$image" "$worktree/services/ai"
  echo '=== Warm existing local model ==='
  docker exec "$model" ollama run qwen2.5:1.5b "Reply with the single digit 0."
  docker run --rm -i --network "$net" \
    -e AMI_AI_PROVIDER=ollama -e AMI_OLLAMA_URL=http://ollama:11434 \
    -e AMI_OLLAMA_MODEL=qwen2.5:1.5b "$image" /app/.venv/bin/python -u - <<'PYTHON'
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
        "INTRO-RANDOM": ["INTRO-OCTOPUS", "INTRO-PENGUIN", "INTRO-CHESS", "INTRO-HEXAGON", "INTRO-DOZEN", "INTRO-PIANO", "INTRO-CENTURY", "INTRO-ALPHABET"],
        "Q-DOG": ["DOG-RECIPE", "DOG-SATURN", "DOG-LAUNDRY", "DOG-NEPTUNE", "DOG-PANCAKE", "DOG-POTATO", "DOG-TOWELS", "DOG-WASHING"],
        "Q-RAT": ["RAT-RECIPE", "RAT-LAUNDRY", "RAT-PENGUIN", "RAT-KILOGRAM", "RAT-BREAD", "RAT-FRUIT", "RAT-CALENDAR", "RAT-BOOKS"],
    }
    combined = {question: Counter() for question in cases}
    valid = 0
    for question, facts in cases.items():
        for locale in ("pt-BR", "en"):
            counts = Counter()
            reasons = Counter()
            for sample in range(1, 13):
                request = GenerationRequest(requestId=str(uuid4()), questionId=question,
                    category="RANDOM", locale=locale, factIds=facts, deadlineMs=2500)
                context = retrieve(request)
                if context is None or len(context.selection_options) != 8:
                    raise RuntimeError("Missing expanded authorized context")
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
    print(json.dumps({"validated":valid,"total":72}))
    if valid == 0:
        raise SystemExit("No validated real output")
asyncio.run(main())
PYTHON
  echo '=== Bilingual regression ==='
  docker run --rm --network "$net" \
    -e AMI_AI_PROVIDER=ollama -e AMI_OLLAMA_URL=http://ollama:11434 \
    -e AMI_OLLAMA_MODEL=qwen2.5:1.5b "$image" /app/.venv/bin/python -m app.evaluate_local
  echo '=== EXPANDED RANDOM AUDIT COMPLETE ==='
)
