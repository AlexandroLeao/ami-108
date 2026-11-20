# Safe Cloud Shell pause and resume

**Type:** operational how-to. **State:** last owner-verified pause completed. **Authority:** [current release readiness](release-readiness-matrix.md); [archived VM/model operations](cloud-shell-pause-history.md) are **not** instructions for the present environment.

## Scope and latest state

The owner successfully recovered the approved private runtime `14ea583` on the replacement VM, confirmed Continue, then performed a new **full-read/SHA-256-verified database backup** with **7 saved sessions / 0 pending generations / 4 finished migrations**. All four Compose services are now **stopped** without volume deletion, the private `.env` copy is retained and Ollama is **not installed** on this replacement VM. The exact archive name, measurements and evidence are recorded **only** in [release readiness](release-readiness-matrix.md).

**Do not restart the stack for documentation work.** The previously checked-in [AI-ON pause script](../scripts/pause-cloud-shell-safely.sh) requires `AMI_AI_GENERATION=1` and a running Ollama container; it **does not apply** to the currently paused AI-OFF setup. The owner already completed an independently guarded AI-OFF backup/stop. Prior one-time recovery commands belong in [Cloud Shell history](cloud-shell-pause-history.md).

## Preconditions for a future return

1. Use **standard Cloud Shell**, not an ephemeral session. Confirm the repository still has the expected **approved gameplay commit `14ea583`**, a clean working tree and a restricted, gitignored private `.env`.
2. Examine Docker images, containers and named volumes **before** starting or creating anything. Cloud Shell may replace its temporary VM while preserving `$HOME`.
3. Find the latest private `pause-ami108-*.dump` and its matching `.sha256` and pause-status record under `$HOME/ami-108-backups`; verify the checksum and complete PostgreSQL custom-archive readability using a compatible client. Do not print the dump or `.env` into a terminal transcript, PR or chat.
4. Confirm sufficient root disk and RAM before any image/model download. A prior VM had **5.8 GiB free**, below the pinned Ollama preparer's **10 GiB guard**; do not circumvent that protection.
5. If anything conflicts with the backup status, accepted commit or previous saved-session totals, **stop and investigate without data writes**.

## Recovery decision: never assume the database is empty

| Observation | Safe decision |
| --- | --- |
| Existing PostgreSQL named volume and populated game database survived | **Do not restore.** Verify schema/migrations, session counts and container health; restart services only with a reviewed, environment-specific plan |
| No prior PostgreSQL volume or AMI containers remain | Do not destroy other Docker data. Verify the archive and preconditions, create a **new proven-empty** database target and conduct exactly one controlled restore with an explicit plan |
| State is unknown, a volume is partly populated, the archive fails verification, or disk is inadequate | **Stop.** Retain all files and request review. No `pg_restore`, `migrate reset`, Docker pruning or blind retries |

After any authorized recovery, check database counts **before** gameplay, confirm the Web/API/AI health endpoints and use the existing browser origin for Continue. A healthy FastAPI response **does not** prove that the model is installed, warmed or generating. AI activation is a **separate** gate and is not required for an authored-fallback preview.

## Safe pause policy for any later active session

Before stopping services, an operator must identify the **actual live configuration** (AI ON/OFF, installed model, DB name and state) and use a specifically reviewed pause procedure. The safe order is: stop Web/API writers; verify exact non-pending session/migration counts; export a new unique private PostgreSQL custom-format archive; validate the list, full read and SHA-256; save a private `.env` copy; recheck counts and DB identity; stop the remaining services; verify all intended containers stopped; record the final status.

Only a confirmed `SAFE PAUSE COMPLETE` with verified backup is a successful pause. On **any** failure, preserve all volumes/backups, inspect the error and do not close the terminal or rerun an old script blindly.

## Data and security boundaries

- **Never** use `docker compose down -v`, `docker system prune`, `docker volume prune` or `pg_restore` into an already populated database.
- Do not update the approved gameplay checkout simply because GitHub `main` contains later documentation or operational fixes; compare and approve any runtime change separately.
- Keep real `.env`, session cookies, dumps, reference sheets and story sources outside Git. Cloud Shell `$HOME` persistence is not an independent disaster-recovery copy; encrypted, owner-approved off-platform backup is recommended.
- Do not provision hosting, disclose facts to an external model, publish the repository or incur costs without explicit owner approval.

See the [development guide](development.md) for source testing, [AI evaluation history](ai-local-evaluation.md) for previous model acceptance and [release readiness](release-readiness-matrix.md) for the current outstanding decisions.
