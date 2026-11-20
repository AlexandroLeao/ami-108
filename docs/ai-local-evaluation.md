# AMI-007 — Isolated local inference evaluation

> **Status guide:** This is a chronological evidence log, not the current AI activation procedure. Previous real-model measurements were on earlier Cloud Shell VMs. The six-save recovered environment has since passed the warmed direct real-model 10/10 bilingual check **and owner-executed API-only activation with gameplay generation ON**. The one-time [pinned Ollama recovery](../scripts/prepare-pinned-local-ollama.sh) and [API activation](../scripts/activate-verified-local-ai.sh) must **not be rerun** on the now-active stack. A separate-browser fresh-game E2E check remains pending; see [current readiness](release-readiness-matrix.md). Historical candidate scripts and prior 10/10 outcomes must not be presented as proof of an untested new VM.

> **Archived PR #38 snapshot:** [historical evidence](history-pr38-snapshot.md). For the latest verified seven-session pause and outstanding release gates, see [release readiness](release-readiness-matrix.md).

Historical development notes below are retained as evidence and do not override the accepted status.

November 18, 2026. Runbook for PR #24; not evidence of real inference or approval to deploy. The accepted Chapters 1–3 stay on main `af212f0`. The evaluation requires separate owner authorization to download and run a local model, after checking the restored save and available resources.

## 1. Historical baseline-confirmation protocol (not a command for the restored six-session VM)

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

## Historical first verification status (initial milestone; newer results below)

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


## November 18 — strict bilingual success and disposable end-to-end gate

Owner-run script `6201105` at exact runtime `47c7621`, same pinned Ollama 0.40.16/Qwen2.5:1.5b ID 65ec06548149, cloud disabled/internal-only network: warmup 5126 ms; both passes 10/10 VALIDATED, aggregate 20/20 (PT 10/10, EN 10/10), all selected authorized alternatives, 0 timeouts. Observed elapsed 160–1919 ms. This demonstrates strict provider-level success on the warmed Cloud Shell sample, not a guarantee under cold start/concurrent load or production hosting. Existing CI [44313157368](https://github.com/AlexandroLeao/ami-108/actions/runs/44313157368) passed at `6432402`.

New E2E script `fc366bf` builds the same candidate in a detached worktree, creates a fresh private network, database and model volumes, uses randomly generated test-only credentials, and runs built Next.js → NestJS → FastAPI → Ollama against disposable PostgreSQL. No published ports, no accepted DB mounts, no migration of the owner's save. Online pass requires real validated INTRO/DOG/RAT receipts, duplicate-command single debit, bilingual persisted slots, retry cache, CP-DOG/CP-RAT and F2 through Chapter 4 card. API restart verifies saved state; stopping only the isolated Ollama then runs a new full fallback session. Cleanup targets only uniquely named test resources; accepted-stack health and session count are read-only checks. The script has not run yet; all E2E evidence pending, no merge or provider activation in main. Owner review still required.


## November 18 — real-provider end-to-end success; owner browser preview gate

Owner-run E2E script `fc366bf` at runtime `47c7621`: online INTRO VALIDATED, DOG PT RANDOM VALIDATED in 1688 ms, RAT EN RANDOM VALIDATED in 1468 ms. Duplicate command, single debit, bilingual slot persistence, retry cache, two checkpoints and F2 through Chapter 4 card passed. API restart retained session and slots. With the isolated model stopped, all three generation receipts reported FALLBACK_REQUIRED/UNAVAILABLE; DOG 64 ms and RAT 102 ms, same persistence and campaign progression passed. Log ends ISOLATED E2E PASSED and the accepted main stack remained healthy with one original session. This is real HTTP/database integration evidence for sampled RANDOM encounter categories (both categories already validated in the direct benchmark), not browser interaction or production deployment. CI [44313806370](https://github.com/AlexandroLeao/ami-108/actions/runs/44313806370) passed at `c5c7b23`.

Owner requested the moment to playtest. Script `b3a1235` prepares the same runtime on port 3002, bound to host loopback only, with separate model/database volumes and networks. The web container alone joins the preview bridge; API, DB, FastAPI and model remain internal. No owner save, environment secrets or main changes. Use Cloud Shell Web Preview port 3002, start a new game, test INTRO, DOG and RAT, locale, retry and Continue. Keep terminal open; Enter prints anonymized receipt/slot counts and cleans only experimental resources, including the disposable playtest save. Warmup is outside timing; model may unload after inactivity, and fallback is intentional. Browser preview script is new and not executed yet. Keep PR #24 draft until owner accepts the manual playtest and reviews final merge; no production or paid resources.


## Final owner browser audit — November 18

Owner supplied the completed port-3002 preview log (script `b3a1235`, runtime `47c7621`): warmup 6437 ms, 13 VALIDATED and 1 FALLBACK_REQUIRED/TIMEOUT generation receipts (13/14 = 92.9%). Twelve encounter slots: DOG 1 CORRECT + 5 RANDOM, RAT 2 CORRECT + 4 RANDOM. Receipt totals include introductions, not only encounter consultations; category counts do not identify which request timed out. Owner reported all eight desktop/mobile checks passed, including Continue. The accepted port-3000 stack remained healthy and contained one original session. This confirms real inference in browser play and graceful fallback; it does not guarantee 100% live latency. No secrets or private save contents recorded. PR #24 merged at `d587be9`. The original Cloud Shell installation still requires a verified backup, additive migration and separate local-provider activation.


## November 18 — resource-sensitive re-evaluation after VM replacement

Owner restored the post-migration database on a new Cloud Shell VM and confirmed Continue. At 2 logical CPUs, 7.8 GiB total RAM, 4.6 GiB available before evaluation, the same pinned Qwen2.5:1.5b (65ec06548149), Ollama 0.40.16, runtime `47c7621`, internal network, 3 GiB experimental container limit, and unchanged 2 s HTTP/2.5 s engine deadlines produced 2/10 then 3/10 VALIDATED (5/20 overall; PT 1/10, EN 4/10). All five validated alternatives authorized; remaining 15 were TIMEOUT. Warmup 7604 ms; validated elapsed 306–1879 ms. This differs from the earlier 4-CPU/15-GiB 20/20 warmed result; CPU, memory and workload changed together, so the cause cannot be isolated. No model crash or invalid reply observed. Keep the main provider disabled on this VM rather than impose repeated latency; preserve original deadlines and all accepted content. The prior real-model and browser acceptance remains valid for the tested configuration, not a universal performance guarantee. Continue AMI-009 without blocking on this ephemeral compute constraint. A future 4-CPU session or separately approved compact-model benchmark may re-open the activation gate. No paid provisioning or runtime change.


## November 18 — restored four-CPU VM recheck and diversity baseline

Owner restored the verified final Chapter 4 dump into an empty replacement volume, four migrations current, four healthy services, one session and Continue confirmed on port 3000 at `119bd82`. The isolated pinned runtime `47c7621`, Ollama 0.40.16 (digest 910d0d8107b5…), Qwen2.5:1.5b ID 65ec06548149 (986 MB), four logical CPUs, 15 GiB total and 12 GiB available before evaluation, cloud disabled and internal network, unchanged 2 s HTTP/2.5 s engine deadlines: warmup 3814 ms; pass 1 10/10, pass 2 10/10, PT 10/10, EN 10/10, 20/20 total VALIDATED, all alternatives, zero timeouts or invalid responses. Range 166–1803 ms, mean 1205.65 ms. The benchmark confirms provider feasibility on this observed VM, not universal latency or actual diversity. The `alternative` flag does not identify distinct options; the same model-selected alternative may recur. Main remains fallback-only. No live provider activation.

Issue #29: `scripts/evaluate-random-diversity.sh` repeats six fresh RANDOM requests per authorized context/locale (36 total), reporting only allowlisted variant IDs, counts, distinct/available and fallback reasons; it does not touch the game database or cached slots. Baseline measurement only, not an acceptance claim. Use the same pinned runtime and isolated network; the current main guard is `119bd82`. No runtime or prompt changes, paid resources or private session data.


## November 18 — RANDOM selection repetition reproduced

Owner audit script `39cd1aa`, runtime `47c7621`: 36/36 VALIDATED, no fallback, but each context selected exactly one variant across all 12 fresh requests: INTRO-PENGUIN 12/12, DOG-SATURN 12/12, RAT-LAUNDRY 12/12 (both locales). Distinct coverage 1/2, 1/3, 1/3 respectively; warmup 4864 ms. This reproduces the owner's observed repetition independent of cached slots. The stable prompt order may contribute; semantic preference also possible. No inference of causation beyond measured repetition.

Experimental candidate `d8a3ea8` shuffles the order of existing authorized RANDOM options before model selection and uses the identical permutation for index-to-localized-text mapping. CORRECT order, model, deadlines, allowlists, category probabilities, authored fallback, engine, DB and immutable cached slots unchanged. New tests check permutation mapping in both languages and unchanged CORRECT order. Repeat identical 36-sample audit and additional ten-case bilingual regression on this candidate before deciding whether sufficient. No guarantee of diversity, no new utterances, no provider activation or merge. If still biased, consider explicit engine-managed no-repeat policy and broader owner-approved topic pool; do not weaken validation.


## November 18 — shuffled RANDOM candidate, real benchmark passed

Owner ran script `07b2ac9` against exact provider candidate `d8a3ea8`, same pinned Ollama 0.40.16 and Qwen2.5:1.5b model ID 65ec06548149. Warmup 3922 ms, 36/36 RANDOM VALIDATED (PT18/18 and EN18/18), plus bilingual regression 10/10 VALIDATED, including all four CORRECT cases. No fallback, invalid response or timeout; max observed 1797 ms. Coverage increased from 3/8 to 8/8 authorized options: INTRO-OCTOPUS 6, INTRO-PENGUIN 6; DOG-SATURN 6, DOG-LAUNDRY 4, DOG-RECIPE 2; RAT-LAUNDRY 5, RAT-PENGUIN 6, RAT-RECIPE 1. Each context/language produced at least two distinct options. This confirms measured diversity, not uniformity or a no-repeat guarantee. The existing authored fallback can be returned as VALIDATED and retains its original recipe metadata. No new wording or probabilities. CI 44423854786 passed on `07b2ac9`.

Next gate: owner runs `scripts/preview-random-diversity.sh` using exact `d8a3ea8`, clean main `119bd82`, isolated port 3002, separate disposable database and model, with generation enabled only in preview. Check fresh DOG/RAT consultations, locale and retry reuse, recipe reaction and Continue; finish with anonymized receipt and distinct persisted RANDOM slot counts. Port 3000 and existing save stay unchanged. Preview evidence pending; no merge or activation of accepted installation yet.


## November 18/19 — owner browser acceptance

Owner reported completion of all requested desktop/mobile, bilingual, retry/Continue and fresh consultation checks. Preview script `eeb10ab`, exact runtime `d8a3ea8`; build and isolated port 3002 readiness confirmed. Warmup 3856 ms. Receipt audit: 7 VALIDATED, no reported fallback; DOG 1 CORRECT + 2 RANDOM, RAT 1 CORRECT + 2 RANDOM persisted slots. Distinct persisted text count was NOT obtained: the last aggregate SQL used invalid dollar quoting and aborted before the accepted-stack health audit. The disposable preview cleanup trap ran on exit; verify actual cleanup and main health separately. This is browser acceptance plus positive persistence evidence, not proof of distinct persisted texts; the separate 36+10 real benchmark demonstrated all eight authorized variants. Commit `1881d19` corrects the report-only SQL using a quoted heredoc and preserves main health checks even if the optional aggregate fails. Runtime remains exactly the tested provider. No live activation yet; keep the owner's saved game on port 3000 unchanged until a controlled update.


## November 19 — live owner follow-up, expanded RANDOM pool candidate

Main `f9c89c9` activated local inference on port 3000 after verified `pre-live-ai-20261119-000748.dump`; 10/10 direct bilingual evaluations valid (166–1775 ms), four healthy Compose services, one preserved session. Owner confirmed the rest of the game is OK but reported all-correct rat responses and continued repetition. The rat probability remains 42%; the category and text of previously resolved slots remain immutable, so retry/replay is not a fresh draw. The actual saved category distribution is not yet verified. Do not reset or edit saved slots to force variety.

Candidate `164bb53` extends each RANDOM context from 2/3/3 to eight bilingual utterances (24 context-specific options total), adds exact API allowlist checks and recipe metadata, retains existing fallback and legacy complete fact sets for in-flight requests. Ollama samples three shuffled approved options at most; CORRECT order, facts, category probabilities, engine, persistence, deadlines and fixed dialogue unchanged. Newly authored topical examples follow Master v1.13 categories and owner request for broader variety; owner playtest approval pending. Sampling does not guarantee no repetitions; old slots are intentionally unchanged. `scripts/evaluate-expanded-random-pool.sh` audits only aggregate stored categories/receipt results and evaluates 72 fresh RANDOM requests plus ten legacy bilingual regression cases in a temporary candidate container using the existing internal local model network; close game tabs while testing, no DB writes or service recreation. Candidate CI/real results pending. Keep #29 open and Chapter 5 draft independent.


## November 19 — expanded pool audit

Owner audit at candidate `164bb53`: two saved sessions; DOG 1 CORRECT + 4 RANDOM (2 distinct RANDOM texts), RAT 4 CORRECT + 1 RANDOM (1 distinct RANDOM text). Six VALIDATED generation receipts; API generation enabled, internal token and service configured. This confirms RANDOM exists in RAT, not that a five-slot sample proves probability calibration. Preserve cached slots; no database change.

Expanded 72-request direct benchmark: 71/72 VALIDATED, one INTRO pt-BR TIMEOUT with safe fallback, all DOG and RAT samples valid. Each context reached 7/8 distinct options, total 21/24 versus previous 8/8. All ten legacy regression cases VALIDATED, including four CORRECT; combined 81/82 (98.8%). Some bias remains (RAT-BREAD 10/24); no promise of non-repetition. Exact PR head `d37e423` passed both Python and TypeScript CI 44428318127. Candidate runtime unchanged. Owner preview script `688883c` reuses existing pinned model and unchanged web image, builds candidate API/AI, isolates new DB and preview network, binds only port 3002, attaches preview AI to model network, never removes live model/volume/network. Close main tabs while testing; use NEW game in preview, all three consultations, verify retry/locale/Continue, aggregate distinct RANDOM slots, no save change. Acceptance and final CI pending; no merge yet.


## Final owner acceptance and installed baseline (November 18 local / November 19 UTC)
PR #36 exact runtime `164bb53` preview approved by owner: seven VALIDATED receipts, DOG 3 RANDOM / 3 distinct / 0 recipe, RAT 2 CORRECT + 1 RANDOM / 1 distinct / 1 recipe; two main sessions retained and all main services healthy. Exact head `87ddf4a` CI 44428871649 passed, merge `ec61f29` tree identical. Owner installed main: verified pre-expanded-ai-20261119-003627.dump, API/AI rebuild 13.5 s, 10/10 direct regression (167–1581 ms), generation enabled/token configured, DB/API/AI healthy, web still starting at immediate report, two sessions. #29 closed after owner acceptance and installation. Final shutdown backup/health check subsequently passed; Day 4 VM restored the verified archive and two sessions. Campaign installation and Continue now owner-confirmed; model reactivation and live regression deferred to next session. Model/container activation is local and ephemeral; on replacement VM recheck resources, verify save before model activation. No paid resources, production deployment or guaranteed universal latency.


## Post-security live gameplay regression — November 19

Owner reports repetitive INTRO and consultation utterances. At live `f89c342` the earlier direct 10/10 legacy bilingual evaluation and enabled API configuration did not predict actual gameplay: aggregate receipts changed from 7 VALIDATED / 6 TIMEOUT (4 sessions) to 7 VALIDATED / 10 TIMEOUT (5 sessions). Four additional timed-out receipts, zero newly validated; no per-context attribution or cold/warm timing in this transcript. The fixed authored fallback for each context explains repeated text; a direct success is not proof of E2E success.

Owner requests fresh RANDOM variation. Candidate uses only existing approved eight bilingual utterances per INTRO/DOG/RAT context, including original authored fallback, with server-owned uniform selection of an unused option before an enabled inference reservation. New RANDOM slots within the same encounter exclude earlier committed RANDOM text; if provider repeats a prior option, keep the reserved distinct fallback with INVALID_OUTPUT audit (not a validated generation). If provider times out/unavailable, keep the reserved option with actual fallback reason. Intro gets a fresh random choice for each new session; repeats across independent sessions remain possible with a finite pool. Existing saved intro and slots, category draw (15/42/100), energy, correct advice, recipe metadata, BOAR, deadlines and wire schema unchanged. Disabled generation retains the previous authored-only behavior. No new dialogue or facts, no migration. Old pending reservations retain already stored fallback; no reroll on reload/retry. Tests must prove all eight intro options, three distinct slots in each context under timeout/repeat, bilingual consistency, persistence/replay and full campaign/hash regression. New behavior is candidate-only pending CI and owner preview.

Separate diagnostic: run the actual authenticated FastAPI endpoint using the expanded eight-fact gameplay requests in both locales, measure wall-clock and reason without printing token/text or touching saves. Observe current Ollama residency, then compare explicitly warmed sample. Do not increase deadlines or assume a timeout cause without evidence. Previous direct evaluator uses legacy fact sets, so it is not a substitute for this measurement. No paid model or public service.


Owner authenticated expanded-pool diagnostic: Ollama ps initially empty, cold INTRO timeout 2033 ms; explicit warmup 5303 ms, followed by 10/10 VALIDATED (both locales 5/5, 1107–1962 ms). Cold model loading is demonstrated as a cause, not proven to explain every earlier gameplay timeout. Keep 2s transport / 2.5s application deadlines. Candidate introduces explicit AMI_OLLAMA_KEEP_ALIVE=-1 for dedicated local model residency (numeric -1 in Ollama JSON); default 5m retained, other values fail closed. No model pull, new facts, paid services, or public access. Use only with pinned model/internal-only network and observed 3 GiB model limit; resident memory remains allocated until stop/unload. Warm explicitly outside gameplay after model restart. Preview script uses detached candidate, disposable DB, existing web image and shared pinned model on internal network. It sets opt-in residency and reports aggregate receipts, distinct RANDOM slots and intro counts; no main DB writes. Close port 3000 during preview, and verify main health/count afterward. Shared model residency may temporarily change; current live provider still sends 5m. Owner preview and final exact CI required before integration.


## Current recovery reactivation gate — November 19, 2026

The owner recovered a Cloud Shell VM with **6 saved sessions**, **0 pending generations** and **4 migrations** from the validated final private pause archive; Web, API, AI and PostgreSQL services are healthy, and Continue works. Inference is currently intentionally **disabled** in the restored API (no Ollama container present yet); prior 10/10 results do not constitute a new real-model result on this VM. The [pinned local Ollama preparation script](../scripts/prepare-pinned-local-ollama.sh) is designed to restore **only** the model container and AI's internal network, warm the model and verify ten authorized bilingual cases while keeping `AMI_AI_GENERATION=0`, and confirming six sessions unchanged. Exact CI syntax/safety preflight is not live-model acceptance. The owner must run the script and report the model identity, residency and 10/10 results before any API activation. Never run against player session state or remove any restored database volume.


## Recovered-VM first provider test — owner log November 19 local / November 20 UTC

Owner executed [pinned local model preparation](../scripts/prepare-pinned-local-ollama.sh) on clean accepted local runtime `14ea583`. The Docker image digest matched `sha256:910d0d8107b538fb0894e63163eb195de0cc7aefcbc666dc62d3b18f71124592`; the approved Qwen2.5:1.5b model ID `65ec06548149` was downloaded, and the script reached its model isolation, warmup and direct authenticated FastAPI test phases. Setup preflight confirmed `GAME_INFERENCE=OFF`, private model config, and `6|0|4` sessions/pending/migrations. Warmup took **3925 ms**, outside game latency limits.

The first direct 10-case test returned **8 VALIDATED + 2 FALLBACK_REQUIRED/TIMEOUT**: PT-BR INTRO-RANDOM (~2048 ms) and PT-BR DOG CORRECT (~2008 ms) fell back at the existing 2-second provider transport deadline. The remaining eight requests were validated at roughly 1021–1574 ms. This pattern is **consistent with** but does **not prove** a cold or still-initializing provider; do not raise the deadline based on this sample. The script exited on strict 10/10 assertion, before its final `ollama ps` / database-count recheck; therefore model permanence and the **after** count require another explicit check. The script did not enable game inference or write to the player database.

**Do not rerun the one-time installer.** For the already-installed model only, use the [strict warmed-instance recheck](../scripts/recheck-warm-local-ai.sh), which asserts the original exact runtime, unchanged private auth, existing healthy services, image/model pin and single internal-only Ollama network, a 3 GiB limit, no published model port and six sessions before calling the **same** ten authorized bilingual FastAPI cases. It then checks the same database count and the game-generation flag regardless of the ten-case result. The recheck has no create/start/rebuild/restore/delete commands, does not touch game sessions, and does not increase provider deadlines. New operator-run **10/10 VALIDATED** and live `ollama ps` residency evidence are required before a **separate** gameplay-generation activation.


## Verified recovered-VM warmed model — November 19 local / November 20 UTC

Owner ran the [existing-model recheck](../scripts/recheck-warm-local-ai.sh) on approved local runtime `14ea583`. The pinned Qwen2.5:1.5b model `65ec06548149` was resident at `Forever` (CPU runner, approximately 1.2 GB loaded). Warmup on an already resident model took **310 ms**. All ten real authenticated FastAPI cases were **VALIDATED**: PT-BR and EN INTRO-RANDOM, DOG CORRECT/RANDOM, RAT CORRECT/RANDOM; individual durations **1220–1711 ms**, under the unchanged 2-second provider deadline. The successful second pass supports model warmup/settling as a plausible contributor to the previous first-two timeouts, **not a universal latency guarantee**.

The script verified healthy DB/API/Web/AI, private-only pinned inference network and 3 GiB Ollama limit; the database container ID and counts stayed unchanged at **6 GameSession / 0 pending / 4 completed migrations**, and both pre/post API checks showed `AMI_AI_GENERATION=0`. **The model is ready for an explicitly authorized API-only activation; no in-game generation has yet been proved on this recovered VM.** The separate [activation script](../scripts/activate-verified-local-ai.sh) checks the unchanged backup state and security boundaries, privately backs up and updates only the untracked `.env` switch, recreates **only** the API container, confirms all endpoints/DB records and attempts safe rollback on failure. Its CI tests are preflight/fixture checks, not a substitute for the owner's live activation and fresh-game review. Do not rerun database restore or model installation.

## Owner-confirmed API-only game inference activation — November 19 local / November 20 UTC

The owner executed the exact [guarded API activation](../scripts/activate-verified-local-ai.sh) against the existing healthy recovered private runtime `14ea583`. Preflight: `CURRENT_GAME_GENERATION=OFF`, pinned Qwen2.5:1.5b `65ec06548149` resident at `Forever`, and **6 GameSession / 0 pending / 4 migrations**. The script privately backed up the untracked `.env`, changed only `AMI_AI_GENERATION=1`, and recreated **only API** with `--no-deps --no-build`. Terminal confirmed `CURRENT_GAME_GENERATION=ON`, HTTP health for Web 3000/API 3001/AI 8000, unchanged **6/0/4** database counts, and the same resident Ollama model. The owner reports **Continue works** in the original browser. No reported API rollback was needed.

**Scope of acceptance:** Real model direct API validation was 10/10 before this activation. Gameplay generation is now technically ON, but **a fresh new-game browser INTRO and DOG/RAT consultation/variation proof on this recovered VM has not yet been supplied**. Do not treat technical activation or saved-session Continue as evidence of new in-game generation success. Do not rerun restore, model bootstrap or activation merely to gather that evidence. The previously accepted full-campaign and variation checks were from earlier private preview sessions.


## Owner browser acceptance after activation — November 19, 2026

With the pinned resident Qwen2.5:1.5b serving local-only inference and `AMI_AI_GENERATION=1`, the owner confirmed **Continue** and reported successful **mobile/desktop playtesting in PT-BR and English**, with visibly more varied RANDOM responses. This is accepted **owner-observed end-to-end functionality** on the recovered private environment. It does **not** provide a quantified E2E count of `VALIDATED` receipts, prove that every observed RANDOM response came from model rather than the authorized varied fallback, establish a universal latency limit, or complete formal assistive-technology and security QA. The earlier direct 10/10 authenticated benchmark and first warmup 8/10 TIMEOUTs remain distinct technical evidence.

All story, consultation probability rules, saved-response caching, original art and model deadlines remain unchanged. The fresh games may have created more than the six sessions counted before playtesting. That next operation is now **complete**: the owner ran the reviewed safe-pause script, exporting a new **182,626-byte** full-readable, SHA-256-verified private dump with **7 sessions / 0 pending / 4 migrations**, and stopped the Web/API/AI/DB/Ollama services. The prior six-session value is a recovery checkpoint only; the next session should inspect the [safe pause record](cloud-shell-pause-resume.md), not rerun installation or restoration blindly.
