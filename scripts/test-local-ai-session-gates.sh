#!/usr/bin/env bash
# Test only standalone save-count gates; never access Docker, a live DB or secrets.
set -euo pipefail

files=(
  scripts/prepare-pinned-local-ollama.sh
  scripts/recheck-warm-local-ai.sh
  scripts/activate-verified-local-ai.sh
)

for file in "${files[@]}"; do
  helper=$(sed -n '/^  accepted_counts() {/,/^  }/p' "$file")
  test -n "$helper"
  test "$(printf '%s\n' "$helper" | wc -l)" -eq 4
  bash -c '
    set -euo pipefail
    source /dev/stdin
    accepted_counts "7|0|4"
    accepted_counts "8|0|4"
    accepted_counts "10|0|4"
    for bad in "6|0|4" "7|1|4" "7|0|3" "7|0|5" "0|0|4" "7|0|4|0" "7,0,4" "abc|0|4"; do
      if accepted_counts "$bad"; then
        echo "Unexpected accepted snapshot: $bad" >&2
        exit 1
      fi
    done
  ' <<< "$helper" || { echo "Recovery count check failed: $file" >&2; exit 1; }
done

echo 'Local AI recovery guards: >=7 sessions, 0 pending, 4 migrations'
