#!/usr/bin/env bash
# Update all git repositories under content/third_party
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
THIRD_PARTY_DIR="$PROJECT_ROOT/content/third_party"

updated=0
skipped=0
failed=0

for repo in "$THIRD_PARTY_DIR"/*/; do
    [ -d "$repo" ] || continue
    name="$(basename "$repo")"

    if [ ! -d "$repo/.git" ]; then
        echo "[$name] skipped (not a git repository)"
        ((skipped++)) || true
        continue
    fi

    echo "[$name] updating..."
    if git -C "$repo" pull --ff-only --quiet 2>&1; then
        echo "[$name] done"
        ((updated++)) || true
    else
        echo "[$name] FAILED (local changes or divergence)"
        ((failed++)) || true
    fi
done

echo ""
echo "Summary: $updated updated, $skipped skipped, $failed failed"
