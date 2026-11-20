#!/usr/bin/env bash
# No actual model, network, or database is used in CI.
set -euo pipefail
root=$(mktemp -d)
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/repo" "$root/bin"
git init -q -b main "$root/repo"
git -C "$root/repo" config user.email ci@example.invalid
git -C "$root/repo" config user.name "AMI QA"
echo .env > "$root/repo/.gitignore"
git -C "$root/repo" add .gitignore
git -C "$root/repo" commit -qm fixture
touch "$root/repo/.env"
chmod 600 "$root/repo/.env"
cat > "$root/bin/docker" <<'SH'
#!/usr/bin/env bash
touch "$DOCKER_MARKER"
exit 0
SH
chmod +x "$root/bin/docker"
set +e
AMI108_REPO="$root/repo" DOCKER_MARKER="$root/docker-touched" PATH="$root/bin:$PATH" \
  bash scripts/recheck-warm-local-ai.sh > "$root/log" 2>&1
rc=$?
set -e
test "$rc" -ne 0
grep -Fq 'VERIFY EXISTING LIVE STACK' "$root/log"
test ! -e "$root/docker-touched"
echo 'Warm-model recheck refuses unapproved runtime before Docker operations'
