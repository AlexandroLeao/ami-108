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

The first Cloud Shell attempt stopped before building or downloading the model: the randomly generated Docker image name contained uppercase letters. The corrected script normalizes the temporary suffix to lowercase and is pinned below for review and execution. Real model evaluation has not yet run. Inspect outputs and stop on failure. The exact tested code is pinned to `7d9ef512a92ede0e99c5418e0ddcc3fec9774a01`; the Ollama image ID and model listing must be recorded for reproducibility. The command runs two passes without altering the 2500 ms application deadline (the provider itself uses a 2 s HTTP timeout). The first includes cold startup; the second is a repeat, not a guaranteed warm measurement if the first failed.

```bash
cd ~/ami-108
git fetch origin feat/ai-rag-foundation
git show 30ee343fbf2b3cf35783a0fb398d1447aed34026:scripts/evaluate-local-ai.sh > /tmp/ami108-evaluate-local-ai.sh
bash -n /tmp/ami108-evaluate-local-ai.sh && bash /tmp/ami108-evaluate-local-ai.sh
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

## November 18 — first real benchmark and diagnosis

Owner confirmed the restored session through Continue before testing. Corrected script `30ee343` built successfully at candidate `7d9ef51`. Ollama 0.40.16, image digest `sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592`, Qwen2.5:1.5b model ID `65ec06548149` (986 MB). Log confirms cloud disabled, internal-only network, no published port. Two passes: 0/20 validated, 20/20 TIMEOUT (2003–2037 ms), 0 alternatives. The HTTP client timeout is 2s; actual model completion latency and quality remain unknown. Do not claim a successful inference. Fallback signal worked in the direct evaluator; not an end-to-end gameplay test.

Diagnostic-only script `2962c4f` reuses the exact runtime candidate and image digest, performs a warmup, evaluates two full-text cases and ten short numeric option-selection cases through the existing exact-text validator. The index is mapped only to the current authorized list; no runtime integration, new facts, probabilities, or deadline changes. Manual diagnostic timeout 28s / request 30s is not a proposed gameplay deadline. It stops after a timeout to avoid contaminating subsequent measurements. Record actual latency, validated/alternative counts and coverage before deciding whether to implement short selection. Results pending; main and all approved game files untouched.


## November 18 — successful real-model diagnostic and runtime candidate

Owner diagnostic `2962c4f` at `7d9ef51` with four logical CPUs, same Ollama/model digest: warmup 4147 ms (load 2839 ms); full-text DOG CORRECT 2/2 validated (PT 8038 ms; EN 5550 ms); index 10/10 validated and 10/10 noncanonical authorized alternatives. Index durations PT INTRO/DOG-C/DOG-R/RAT-C/RAT-R = 1724/2512/2350/1942/2022 ms; EN = 1018/1571/1914/1367/1283 ms. Seven of ten within 2s. Diagnostic used a relaxed deadline, so no strict runtime claim; no E2E evidence yet. All model output was bounded to approved options and verified by the exact validator. This proves constrained real inference, not unrestricted generation or diverse sampling over repeated runs.

Runtime candidate `4ca9685` uses the measured numeric index prompt with up to four generated tokens, maps exact in-range indices only and preserves both existing text validators, 2s transport timeout, 2.5s application deadline, facts, probabilities, saves and disabled-by-default configuration. Invalid indices fall back. No changes to the gameplay, NestJS, PostgreSQL schema or approved art. Test script `ba212d1` warms the model before repeating the original strict 10-case evaluation twice, using the pinned image and candidate; no game database. CI and strict benchmark results pending. Do not merge. Next: evaluate actual strict coverage, then an isolated disposable stack for end-to-end verification; no paid service or permanent production provider assumed.


## November 18 — strict index benchmark and shared bilingual selection

Owner-run strict benchmark script `ba212d1` at runtime `4ca9685` with the same pinned Ollama and Qwen model: warmup 4318 ms, pass 1 validated 6/10, pass 2 validated 7/10. Aggregate 13/20 validated (all alternatives), 7/20 TIMEOUT (all PT); EN 10/10, PT 3/10. Validated times 158–1960 ms. PT INTRO 2/2, DOG CORRECT 0/2, DOG RANDOM 0/2, RAT CORRECT 1/2, RAT RANDOM 0/2. EN each context 2/2. This is direct provider evidence, not E2E; timed-out requests could affect subsequent calls and warmed repeat may benefit from cached prompts. No deadline change. CI 44312593442 succeeded at `92f9967`.

Candidate `47c7621` uses the same authorized English options for index selection regardless of requested locale, sourced from the exact same bilingual rule after the existing context gate; the selected index maps exclusively to the requested-language text. This is not model translation or free generation. Both exact-text validators remain authoritative; existing facts, probabilities, costs, save behavior and deadlines stay intact. Two tests check the shared prompt and localized mapping. Script `6201105` repeats the pinned warm strict benchmark on this candidate. New CI and real measurements pending. Do not claim latency improvement until measured; no change to the accepted main or database. Next gate remains a disposable-stack real-provider E2E test, including fallback and persistence. No merge.
