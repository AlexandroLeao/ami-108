#!/usr/bin/env bash
# The bootstrap must fail before any Docker activity on an unapproved checkout.
set -euo pipefail
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
repo="$fixture/repo"
mkdir "$repo" "$fixture/bin"
git init -q -b main "$repo"
git -C "$repo" config user.email "ci@example.invalid"
git -C "$repo" config user.name "AMI QA"
echo ".env" > "$repo/.gitignore"
git -C "$repo" add .gitignore
git -C "$repo" commit -qm fixture
touch "$repo/.env"
chmod 600 "$repo/.env"
cat > "$fixture/bin/docker" <<'SH'
#!/usr/bin/env bash
touch "$DOCKER_MARKER"
exit 0
SH
chmod +x "$fixture/bin/docker"
set +e
AMI108_REPO="$repo" DOCKER_MARKER="$fixture/docker-was-called" \
  PATH="$fixture/bin:$PATH" bash scripts/prepare-pinned-local-ollama.sh > "$fixture/output" 2>&1
rc=$?
set -e
test "$rc" -ne 0
grep -q 'ACCEPTED LOCAL BASELINE' "$fixture/output"
test ! -e "$fixture/docker-was-called"
echo 'Pinned Ollama safety preflight: rejects unapproved checkout before Docker calls'
