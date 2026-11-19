#!/usr/bin/env bash
# Owner-run recovery of the previously accepted private local model.
# It does NOT start/recreate the game services, mutate saves, restore DB,
# enable real gameplay generation, open model host ports or use paid inference.
(
  set -euo pipefail
  cd "${AMI108_REPO:-$HOME/ami-108}"
  umask 077
  set +x

  runtime="14ea583a83c7c1473bc94f3b1d515a8497827ac3"
  image="ollama/ollama@sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592"
  model="qwen2.5:1.5b"
  model_id="65ec06548149"
  server="ami108-local-ollama"
  network="ami108-local-inference"
  volume="ami108-local-ollama-models"
  created_server=0
  isolated_server=0
  stop_unisolated_model_on_failure() {
    status=$?
    if (( status != 0 )) && (( created_server == 1 )) && (( isolated_server == 0 )); then
      # Do not leave an aborted bootstrap process listening on Docker's bridge.
      # Retain its named volume for operator review; do not remove anything.
      docker stop -t 10 "$server" >/dev/null 2>&1 || true
    fi
  }
  trap stop_unisolated_model_on_failure EXIT

  echo "=== ACCEPTED LOCAL BASELINE ==="
  test "$(git branch --show-current)" = main
  test "$(git rev-parse HEAD)" = "$runtime"
  test -z "$(git status --porcelain)"
  test -f .env
  git check-ignore -q .env

  for service in db ai api web; do
    test "$(docker inspect --format '{{.State.Health.Status}}' "ami-108-$service-1")" = healthy
  done

  # Keep the resumed game in fallback-only mode throughout provider setup.
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
assert len(os.environ.get("AMI_AI_INTERNAL_TOKEN","")) >= 32
print("PRIVATE_MODEL_CONFIGURATION=OK (token not disclosed)")
PY

  counts() {
    docker compose exec -T db sh -ec       'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT (SELECT count(*) FROM \"GameSession\") || chr(124) || (SELECT count(*) FROM \"GamePendingGeneration\") || chr(124) || (SELECT count(*) FROM \"_prisma_migrations\" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL);"'
  }
  before=$(counts)
  echo "SESSIONS|PENDING|MIGRATIONS=$before"
  test "$before" = "6|0|4"
  test "$(df -Pk / | awk 'NR==2 {print $4}')" -ge 10485760
  test "$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)" -ge 4194304

  if docker container inspect "$server" >/dev/null 2>&1; then
    echo "Existing Ollama container: stop and review; no replacement performed." >&2
    exit 1
  fi
  if docker network inspect "$network" >/dev/null 2>&1; then
    echo "Existing inference network: stop and review; no replacement performed." >&2
    exit 1
  fi

  echo "=== PINNED LOCAL IMAGE AND MODEL ==="
  docker pull "$image"
  docker volume create "$volume"
  docker run -d --name "$server" --network bridge     --memory 3g --memory-swap 3g     -e OLLAMA_NO_CLOUD=1     -e OLLAMA_HOST=0.0.0.0:11434     -e OLLAMA_NUM_PARALLEL=1 -e OLLAMA_MAX_LOADED_MODELS=1     -v "$volume:/root/.ollama" "$image"
  created_server=1

  ready=0
  for _ in $(seq 1 40); do
    if docker exec "$server" ollama list >/dev/null 2>&1; then ready=1; break; fi
    sleep 2
  done
  test "$ready" = 1

  echo "=== PULLING PREVIOUSLY APPROVED LOCAL QWEN MODEL ==="
  docker exec "$server" ollama pull "$model"
  docker exec "$server" ollama list | grep -F "$model_id"

  echo "=== ISOLATING MODEL ==="
  docker network create --internal "$network"
  docker network connect --alias ollama "$network" "$server"
  docker network disconnect bridge "$server"
  isolated_server=1
  docker network connect "$network" ami-108-ai-1
  test "$(docker network inspect --format '{{.Internal}}' "$network")" = true
  test "$(docker inspect --format '{{.HostConfig.Memory}}' "$server")" = 3221225472
  test "$(docker inspect --format '{{.Image}}' "$server")" = "$(docker image inspect --format '{{.Id}}' "$image")"
  test -z "$(docker port "$server")"
  # The model must be connected ONLY to the internal network at completion.
  docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$server" |
    grep -Fx "$network" >/dev/null
  test "$(docker inspect --format '{{len .NetworkSettings.Networks}}' "$server")" = 1

  echo "=== WARMUP AND TEN AUTHENTICATED CASES (NO DB WRITES) ==="
  docker compose exec -T ai /app/.venv/bin/python - <<'PY'
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

  docker exec "$server" ollama ps
  after=$(counts)
  test "$before" = "$after"
  docker compose exec -T api node -e '
    if (process.env.AMI_AI_GENERATION !== "0") process.exit(1);
    console.log("GAME_INFERENCE=STILL_OFF");
  '
  echo "SESSIONS|PENDING|MIGRATIONS=$after"
  echo "=== LOCAL MODEL PREPARED — GAME INFERENCE NOT YET ENABLED ==="
)
