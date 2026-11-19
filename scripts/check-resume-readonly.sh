#!/usr/bin/env bash
# Read-only Cloud Shell resume preflight. NEVER restores, deletes, starts, stops,
# pulls images, edits .env, or accesses save contents.
set -euo pipefail

repo="${AMI108_RESUME_REPO:-$HOME/ami-108}"
backups="${AMI108_RESUME_BACKUP_DIR:-$HOME/ami-108-backups}"

echo '=== AMI-108 READ-ONLY RESUME CHECK ==='
echo 'This report is diagnostic. A checksum is not a restore test.'

echo '=== SOURCE CHECK ==='
if [[ -d "$repo" ]] && git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'LOCAL_COMMIT=%s\n' "$(git -C "$repo" rev-parse --short=12 HEAD)"
  printf 'LOCAL_BRANCH=%s\n' "$(git -C "$repo" branch --show-current)"
  if [[ -z "$(git -C "$repo" status --porcelain)" ]]; then
    echo 'WORKTREE=CLEAN'
  else
    echo 'WORKTREE=HAS_CHANGES (do not update before review)'
  fi
  if [[ -f "$repo/.env" ]]; then
    echo 'PRIVATE_ENV=PRESENT (values withheld)'
    mode=$(stat -c '%a' "$repo/.env")
    if (( (8#$mode & 8#077) == 0 )); then
      echo 'PRIVATE_ENV_PERMISSIONS=RESTRICTED'
    else
      echo 'PRIVATE_ENV_PERMISSIONS=REVIEW (group/other access)'
    fi
    if git -C "$repo" check-ignore -q .env; then
      echo 'PRIVATE_ENV_GITIGNORE=YES'
    else
      echo 'PRIVATE_ENV_GITIGNORE=NO (do not stage or push)'
    fi
  else
    echo 'PRIVATE_ENV=MISSING (do not start services)'
  fi
else
  echo 'SOURCE=NOT_FOUND (do not restore automatically)'
fi

echo '=== BACKUP CHECK ==='
latest=''
if [[ -d "$backups" ]]; then
  shopt -s nullglob
  archives=( "$backups"/*.dump )
  shopt -u nullglob
  for file in "${archives[@]}"; do
    [[ -f "$file" && ! -L "$file" ]] || continue
    if [[ -z "$latest" || "$file" -nt "$latest" ]]; then
      latest="$file"
    fi
  done
fi
if [[ -z "$latest" ]]; then
  echo 'BACKUP=NOT_FOUND (stop; do not recreate database)'
else
  printf 'LATEST_BACKUP=%s\n' "$(basename "$latest")"
  printf 'BACKUP_BYTES=%s\n' "$(stat -c '%s' "$latest")"
  if [[ -f "$latest.sha256" && ! -L "$latest.sha256" ]]; then
    expected=$(awk 'NR==1 {print $1}' "$latest.sha256")
    if [[ "$expected" =~ ^[a-fA-F0-9]{64}$ ]] && [[ "$(sha256sum "$latest" | cut -d ' ' -f1)" == "${expected,,}" ]]; then
      echo 'BACKUP_CHECKSUM=PASS'
    else
      echo 'BACKUP_CHECKSUM=FAILED (do not restore)'
    fi
  else
    echo 'BACKUP_CHECKSUM=MISSING (do not restore)'
  fi
  if [[ "$(basename "$latest")" == pause-ami108-* ]]; then
    echo 'BACKUP_KIND=FINAL_PAUSE_CANDIDATE'
  else
    echo 'BACKUP_KIND=OLDER_PRE_PAUSE_OR_OTHER'
  fi
fi
echo 'Archive structure and save counts require separate controlled verification.'

echo '=== AVAILABLE RESOURCES ==='
df -h / /home
if [[ "${AMI108_RESUME_SKIP_DOCKER:-0}" == "1" ]]; then
  echo 'DOCKER=SKIPPED_FOR_TEST'
elif ! command -v docker >/dev/null 2>&1; then
  echo 'DOCKER=NOT_INSTALLED'
elif ! docker info --format '{{.ServerVersion}}' >/dev/null 2>&1; then
  echo 'DOCKER=NOT_AVAILABLE'
else
  echo 'DOCKER=AVAILABLE'
  echo 'Existing AMI containers only (no changes):'
  docker ps -a --filter 'name=ami-108-' --filter 'name=ami108-local-ollama' \
    --format '{{.Names}}: {{.Status}}' || true
  echo 'Existing AMI Docker volumes only (no changes):'
  docker volume ls --format '{{.Name}}' | grep -E '^(ami-108|ami108)' || true
fi
echo '=== READ-ONLY CHECK COMPLETE ==='
