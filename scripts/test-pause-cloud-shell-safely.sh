#!/usr/bin/env bash
# Entirely disposable local fixture; no Docker service, DB, or real save is used.
set -euo pipefail
root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/repo" "$root/bin"
git init -q -b main "$root/repo"
git -C "$root/repo" config user.email ci@example.invalid
git -C "$root/repo" config user.name "AMI QA"
printf '.env\n' > "$root/repo/.gitignore"
git -C "$root/repo" add .gitignore
git -C "$root/repo" commit -qm fixture
printf 'AMI_AI_GENERATION=1\n' > "$root/repo/.env"
chmod 600 "$root/repo/.env"
cat > "$root/bin/docker" <<'SH'
#!/usr/bin/env bash
touch "$DOCKER_CALLED"
exit 0
SH
chmod +x "$root/bin/docker"
set +e
AMI108_REPO="$root/repo" DOCKER_CALLED="$root/docker-called" PATH="$root/bin:$PATH" \
  bash scripts/pause-cloud-shell-safely.sh > "$root/out" 2>&1
rc=$?
set -e
test "$rc" -ne 0
grep -Fq 'SAFE PAUSE: VERIFY APPROVED RUNTIME' "$root/out"
grep -Fq 'SAFE_PAUSE=NOT_COMPLETE' "$root/out"
test ! -e "$root/docker-called"
test ! -e "$root/ami-108-backups"
grep -Fxq 'AMI_AI_GENERATION=1' "$root/repo/.env"
if grep -E 'docker (compose )?(down|rm|volume rm|volume prune|system prune)|pg_restore .*--dbname|prisma migrate reset' scripts/pause-cloud-shell-safely.sh; then
  echo "Potentially destructive operation found in pause command" >&2
  exit 1
fi
echo "Pause preflight: wrong runtime fails without Docker calls or secrets/config modification"
