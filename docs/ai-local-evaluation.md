# AMI-007 — Isolated local inference evaluation

November 18, 2026. Runbook for PR #24; not evidence of real inference or approval to deploy. The accepted Chapters 1–3 stay on main `af212f0`. The evaluation requires separate owner authorization to download and run a local model, after checking the restored save and available resources.

## 1. Confirm the accepted baseline first (read-only)

Run from the existing Cloud Shell checkout; do not restore again if any sessions exist. The November 18 owner log shows zero sessions before the initial restore and a nonempty database on the second attempt; all four services subsequently became healthy. That is consistent with a successful first restore but does not prove which sessions were recovered. Confirm the count and Continue in the same browser/origin. Do not expose tokens, IDs, save contents or the backup.

```bash
cd ~/ami-108
git status --short --branch
git rev-parse --short HEAD
docker compose ps
docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM \"GameSession\";"'
free -h
df -h / /home
docker system df
```

Keep the accepted database and its existing private dump intact. A positive count alone is not proof that the intended browser session can resume. If Continue fails, diagnose cookie/origin/expiry and saved state before attempting any further restoration. Never use `docker compose down -v`, volume pruning, or a destructive restore against a nonempty database.

## 2. Independent model-only benchmark (owner-run, after approval)

Candidate: Qwen2.5:1.5b, advertised 986 MB quantized model, Apache-2.0, PT/EN; see https://ollama.com/library/qwen2.5:1.5b. CPU performance and total disk/RAM requirements are unverified. The Docker image, layers and inference memory require additional space. Check the current VM and quotas (https://docs.cloud.google.com/shell/docs/quotas-limits); do not create cloud resources or enable billing. Keep the game preview closed during benchmarking. Use Docker's ephemeral storage, not the limited persistent home directory.

Use a detached worktree and unique test-only Docker objects. The evaluator calls the existing Python provider/validator directly; no API, web, PostgreSQL, `.env`, credentials, saved sessions or full private documents are mounted. The only external activity is downloading the official image, locked dependencies and public model. The benchmark server has no published port and is moved to an internal-only network before sending evaluation prompts. This procedure does not enable gameplay inference. Official references: https://docs.ollama.com/docker and https://docs.ollama.com/faq.

The following is a proposed manual procedure, not yet executed on Cloud Shell. Inspect outputs and stop on failure. The exact tested code is pinned to `7d9ef512a92ede0e99c5418e0ddcc3fec9774a01`; the Ollama image ID and model listing must be recorded for reproducibility. The command runs two passes without altering the 2500 ms application deadline (the provider itself uses a 2 s HTTP timeout). The first includes cold startup; the second is a repeat, not a guaranteed warm measurement if the first failed.

```bash
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
  tag="ami108-eval-${worktree##*.}"
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
  docker pull ollama/ollama
  ollama_image=$(docker image inspect --format '{{.Id}}' ollama/ollama)
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
  evaluate() {
    docker run --rm --network "$net" \
      -e AMI_AI_PROVIDER=ollama \
      -e AMI_OLLAMA_URL=http://ollama:11434 \
      -e AMI_OLLAMA_MODEL=qwen2.5:1.5b \
      "$image" /app/.venv/bin/python -m app.evaluate_local
  }
  status=0
  echo 'PASS 1 (cold candidate)'
  evaluate || status=1
  echo 'PASS 2 (repeat)'
  evaluate || status=1
  exit "$status"
)
```

The EXIT trap removes only the uniquely named evaluation server/network/model volume and detached worktree. It does not remove any game container or game volume. The downloaded Docker image and build cache may remain in ephemeral VM storage; do not prune shared Docker resources. Model download is repeated in a new benchmark because its disposable volume is removed.

## 3. Evidence and gates

- Capture the candidate SHA, Ollama image digest/ID and version, local model ID, current hardware/free disk and all 20 sanitized JSON case results. Do not publish private narrative or session contents.
- Evaluate INTRO, DOG CORRECT/RANDOM and RAT CORRECT/RANDOM in both locales. Count VALIDATED, alternative selections, timeouts and other fallback reasons by case and locale. A nonzero evaluator exit code or one successful case is not acceptance evidence for all contexts.
- Require evidence of actual validated inference in both languages, review each category's coverage and latency, and observe at least one authorized noncanonical alternative before accepting the variation claim. Record failures honestly. No arbitrary generation is enabled. Do not widen validation or change deadlines without a separate review.
- The direct model benchmark does not exercise NestJS HTTP integration or PostgreSQL persistence. After it passes, use a separate disposable database and stack for end-to-end proof (single debit, cache, retry, locale, restart and offline fallback); never point experimental migrations at the restored accepted database for the first test.
- Chapter 3 narrative, art, UI, checkpoint and F2 were already accepted by the owner on November 17; issue #10 remains open only for its AI/fallback criterion. No need to replay or rewrite approved narrative for this benchmark. Q-BOAR is intentionally unavailable until the Chapter 5 gate is implemented.
- Keep PR #24 draft and AMI-006/007/008 open until the relevant acceptance evidence exists. No merge or paid resource is authorized by this runbook.

## Current verification status

Existing CI 44307825385 passed at `7d9ef51` with simulated provider tests (148 total). This runbook adds no runtime code, dependencies, migration, assets or approved story changes. Shell procedure and actual model evaluation remain unexecuted; do not describe them as passed.