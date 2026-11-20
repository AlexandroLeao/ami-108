# Historical initial Cloud Shell return checklist — November 19, 2026

> **ARCHIVED / COMPLETED.** This checklist was written before the owner validated the pause archive, recovered six sessions into a new empty database and verified Continue. **Do not run recovery or restore again on the current populated database.** Current next steps are in [release-readiness-matrix.md](release-readiness-matrix.md).

## First ten minutes of the next session

1. Run the [read-only resume diagnostic](../scripts/check-resume-readonly.sh) (retrieve the exact script from updated GitHub main as described in the [pause/resume runbook](cloud-shell-pause-resume.md)) before starting, building or restoring anything; it checks the latest dump checksum, source and Docker availability without disclosing secrets. Then inspect: `git status --short --branch`, `git rev-parse HEAD`, `df -h / /home`, `docker compose ps -a`, `docker volume ls`, and private backup filenames/size. Check the pause command's reported final `SAFE PAUSE COMPLETE` if available. Do not paste `.env`, cookies, secrets or save payloads.
2. Verify the newest actual `pause-ami108-*.dump` checksum and archive integrity from [pause/resume runbook](cloud-shell-pause-resume.md). An earlier pre-variety dump exists as a fallback, but it may lack saves created afterward; do not overwrite a nonempty database.
3. Determine if the Docker VM, volumes, models and private network survived. If yes, start existing DB and model then AI/API/Web carefully, confirming four migrations, counts, private connectivity, ten-case AI evaluator and Continue. If no, create a fresh empty DB and request a controlled backup restore plan before any write. Do not assume Docker persistence.
4. If the local runtime remains `14ea583`, the newer documentation-only main commit does not require an image rebuild. Fast-forward only after reviewing the diff and backup state.
5. Resume the two most independent QA areas: screen-reader/reduced-motion/browser audit and deployment-cost/security design. Do not modify the frozen narrative, images, mechanics, cached responses or production visibility without specific review.

