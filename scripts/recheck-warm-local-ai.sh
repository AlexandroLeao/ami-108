#!/usr/bin/env bash
# Follow-up ONLY for the already-installed, pinned local Ollama, after a 8/10
# warmup-related timeout candidate. Does not create containers, alter saves,
# enable gameplay AI or extend the strict deadlines.
(
  set -euo pipefail
  cd "${AMI108_REPO:-$HOME/ami-108}"
  set +x
  server=ami108-local-ollama
  net=ami108-local-inference
  image=ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592

  echo "=== VERIFY EXISTING LIVE STACK; DO NOT REINSTALL ==="
  test "$(git branch --show-current)" = main
  test "$(git rev-parse HEAD)" = 14ea583a83c7c1473bc94f3b1d515a8497827ac3
  test -z "$(git status --porcelain)"
  test -f .env
  git check-ignore -q .env
  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$service-1")" = healthy
  done

  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "0") process.exit(1);
    console.log("GAME_INFERENCE=OFF");
  '
  docker compose exec -T ai /app/.venv/bin/python - <<'PY'
import os
assert os.environ.get("AMI_AI_PROVIDER") == "ollama"
assert os.environ.get("AMI_OLLAMA_MODEL") == "qwen2.5:1.5b"
assert os.environ.get("AMI_OLLAMA_URL") == "http://ollama:11434"
assert os.environ.get("AMI_OLLAMA_KEEP_ALIVE") == "-1"
assert len(os.environ.get("AMI_AI_INTERNAL_TOKEN", "")) >= 32
print("MODEL_CONFIG=OK (secret withheld)")
PY

  test "$(docker inspect --format '{{.State.Running}}' "$server")" = true
  test "$(docker inspect --format '{{.HostConfig.Memory}}' "$server")" = 3221225472
  test "$(docker inspect --format '{{.Image}}' "$server")" = "$(docker image inspect --format '{{.Id}}' "$image")"
  test -z "$(docker port "$server")"
  test "$(docker network inspect --format '{{.Internal}}' "$net")" = true
  test "$(docker inspect --format '{{len .NetworkSettings.Networks}}' "$server")" = 1
  docker inspect --format '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$server" |
    grep -Fxq "$net"
  docker inspect --format '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' ami-108-ai-1 |
    grep -Fxq "$net"
  docker exec "$server" ollama list | grep -Fq 65ec06548149

  counts() {
    docker compose exec -T db sh -ec       'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\") || chr(124) || (SELECT count(*) FROM \"GamePendingGeneration\") || chr(124) || (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL);"'
  }
  dbid=$(docker inspect --format '{{.Id}}' ami-108-db-1)
  before=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_BEFORE=$before"
  accepted_counts() {
    local snapshot="$1"
    [[ "$snapshot" =~ ^([0-9]+)\|0\|4$ ]] && (( ${BASH_REMATCH[1]:-0} >= 7 ))
  }

  if ! accepted_counts "$before"; then
    echo "Unexpected saved data before local AI operation; review without modifying saves" >&2
    exit 1
  fi
  echo "=== RESIDENCY BEFORE RETEST ==="
  docker exec "$server" ollama ps

  echo "=== SAME 10 AUTHENTICATED CASES; SAME STRICT DEADLINES ==="
  validation=0
  docker compose exec -T ai /app/.venv/bin/python - <<'PY' || validation=$?
import json, os, time, urllib.request
from collections import Counter
from uuid import uuid4

def post(url, body, headers, timeout):
    req=urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),headers=headers
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.load(resp)

start=time.monotonic()
warm=post(
    "http://ollama:11434/api/generate",
    {"model":"qwen2.5:1.5b","prompt":"Reply with the single digit 0.",
     "stream":False,"keep_alive":-1,"options":{"temperature":0,"num_predict":4}},
    {"Content-Type":"application/json"},90,
)
assert warm.get("done") is True
print("WARMUP_MS",round((time.monotonic()-start)*1000),flush=True)

cases=[
    ("INTRO-RANDOM","RANDOM",["INTRO-OCTOPUS","INTRO-PENGUIN","INTRO-CHESS","INTRO-HEXAGON","INTRO-DOZEN","INTRO-PIANO","INTRO-CENTURY","INTRO-ALPHABET"]),
    ("Q-DOG","CORRECT",["DOG-VISION","DOG-HEARING","DOG-WAIT"]),
    ("Q-DOG","RANDOM",["DOG-RECIPE","DOG-SATURN","DOG-LAUNDRY","DOG-NEPTUNE","DOG-PANCAKE","DOG-POTATO","DOG-TOWELS","DOG-WASHING"]),
    ("Q-RAT","CORRECT",["RAT-LIGHT","RAT-CONTAINMENT"]),
    ("Q-RAT","RANDOM",["RAT-RECIPE","RAT-LAUNDRY","RAT-PENGUIN","RAT-KILOGRAM","RAT-BREAD","RAT-FRUIT","RAT-CALENDAR","RAT-BOOKS"]),
]
token=os.environ["AMI_AI_INTERNAL_TOKEN"]
statuses=Counter()
for locale in ("pt-BR","en"):
    for question,category,facts in cases:
        body={"requestId":str(uuid4()),"questionId":question,
              "category":category,"locale":locale,"factIds":facts,"deadlineMs":2500}
        started=time.monotonic()
        result=post(
            "http://localhost:8000/internal/generate",body,
            {"Authorization":"Bearer "+token,"Content-Type":"application/json"},5,
        )
        status=result.get("status")
        statuses[status]+=1
        print(json.dumps({"locale":locale,"question":question,"category":category,
             "status":status,"reason":result.get("reason"),
             "elapsedMs":round((time.monotonic()-started)*1000)}),flush=True)
assert statuses == Counter({"VALIDATED":10}),dict(statuses)
print("DIRECT_LOCAL_AI=10/10 VALIDATED",flush=True)
PY
  echo "=== VERIFY SAVES, RESIDENCY, AND GAME FLAG AGAIN ==="
  after=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS_AFTER=$after"
  test "$dbid" = "$(docker inspect --format '{{.Id}}' ami-108-db-1)"
  test "$before" = "$after"
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "0") process.exit(1);
    console.log("GAME_INFERENCE=STILL_OFF");
  '
  docker exec "$server" ollama ps
  if (( validation != 0 )); then
    echo "RECHECK=NOT_APPROVED (game generation remains off)"
    exit "$validation"
  fi
  echo "=== EXISTING LOCAL MODEL VALIDATED 10/10 — GAME GENERATION STILL OFF ==="
)
