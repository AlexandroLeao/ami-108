#!/usr/bin/env bash
# Fixture proves no Docker/config writes before accepted runtime and checks
# that the user-only activation contains no prohibited volume/restore commands.
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
printf 'AMI_AI_GENERATION=0\n' > "$root/repo/.env"
chmod 600 "$root/repo/.env"
cat > "$root/bin/docker" <<'SH'
#!/usr/bin/env bash
touch "$DOCKER_MARKER"
exit 0
SH
chmod +x "$root/bin/docker"
set +e
AMI108_REPO="$root/repo" DOCKER_MARKER="$root/docker-called" PATH="$root/bin:$PATH" \
  bash scripts/activate-verified-local-ai.sh > "$root/log" 2>&1
rc=$?
set -e
test "$rc" -ne 0
grep -Fq 'VERIFY APPROVED RUNTIME AND PRIVATE CONFIG' "$root/log"
test ! -e "$root/docker-called"
grep -Fxq 'AMI_AI_GENERATION=0' "$root/repo/.env"
test ! -d "$root/ami-108-backups"
if grep -E 'docker (compose )?(down|rm|volume rm|volume prune|system prune)|pg_restore|prisma migrate reset' scripts/activate-verified-local-ai.sh; then
  echo 'Unsafe destructive operation found' >&2
  exit 1
fi
echo 'API generation activation: rejects wrong checkout before Docker or config mutation'
