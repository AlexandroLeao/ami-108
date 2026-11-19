#!/usr/bin/env bash
# Test-only temporary repo/archives; no access to real saves or Docker.
set -euo pipefail
root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT
repo="$root/repo"
backups="$root/backups"
mkdir -p "$repo" "$backups"
git init -q -b main "$repo"
git -C "$repo" config user.email "test@example.invalid"
git -C "$repo" config user.name "AMI test"
printf '.env\n' > "$repo/.gitignore"
git -C "$repo" add .gitignore
git -C "$repo" commit -qm 'test: ignore secrets'
printf 'test-only-no-secret\n' > "$repo/.env"
chmod 600 "$repo/.env"

archive="$backups/pause-ami108-fixture.dump"
printf 'PGDMP-test-fixture-not-a-real-backup\n' > "$archive"
sha256sum "$archive" > "$archive.sha256"

preflight() {
  AMI108_RESUME_REPO="$repo" \
  AMI108_RESUME_BACKUP_DIR="$backups" \
  AMI108_RESUME_SKIP_DOCKER=1 \
  bash scripts/check-resume-readonly.sh
}
output=$(preflight)
grep -q '^WORKTREE=CLEAN$' <<< "$output"
grep -q '^PRIVATE_ENV=PRESENT' <<< "$output"
grep -q '^PRIVATE_ENV_PERMISSIONS=RESTRICTED$' <<< "$output"
grep -q '^PRIVATE_ENV_GITIGNORE=YES$' <<< "$output"
grep -q '^BACKUP_CHECKSUM=PASS$' <<< "$output"
grep -q '^BACKUP_KIND=FINAL_PAUSE_CANDIDATE$' <<< "$output"

printf 'unexpected-change\n' >> "$archive"
output=$(preflight)
grep -q '^BACKUP_CHECKSUM=FAILED' <<< "$output"

rm -f "$archive.sha256"
output=$(preflight)
grep -q '^BACKUP_CHECKSUM=MISSING' <<< "$output"

rm -f "$archive"
output=$(preflight)
grep -q '^BACKUP=NOT_FOUND' <<< "$output"

echo 'Read-only resume diagnostics: fixture checks passed'
