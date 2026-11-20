#!/usr/bin/env bash
# Fail-closed fixture without real Docker, API, database or tokens.
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
for tool in docker curl; do
  printf '#!/usr/bin/env bash\ntouch "$TOOL_CALLED"\n' > "$root/bin/$tool"
  chmod +x "$root/bin/$tool"
done
set +e
AMI108_REPO="$root/repo" TOOL_CALLED="$root/tool-called" PATH="$root/bin:$PATH" \
  bash scripts/qa-readonly-resumed-metrics.sh > "$root/out" 2>&1
rc=$?
set -e
test "$rc" -ne 0
test ! -e "$root/tool-called"
grep -q 'READ-ONLY QA METRICS' "$root/out"
echo "Read-only QA preflight refuses wrong checkout before Docker or HTTP calls"
