#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TOP="$(git -C "$ROOT" rev-parse --show-toplevel)"

printf 'Expected root: %s\n' "$ROOT"
printf 'Git root:      %s\n' "$TOP"

if [[ "$(cd "$ROOT" && pwd -P)" != "$(cd "$TOP" && pwd -P)" ]]; then
  echo "ERROR: app-site is not inside the expected Metroplist Git root." >&2
  exit 1
fi

NESTED="$(find "$ROOT/main-site" "$ROOT/app-site" -mindepth 1 -name .git -type d -prune -print 2>/dev/null || true)"
if [[ -n "$NESTED" ]]; then
  echo "ERROR: nested Git directories found:" >&2
  printf '%s\n' "$NESTED" >&2
  exit 1
fi

echo "Git boundary is valid: one Metroplist repository contains both projects."
