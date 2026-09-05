#!/usr/bin/env bash
# Diagnose why the homepage Featured grid is empty. Read-only.
#
#   ./dev/featured-check.sh
#
# Prints every custom attribute definition the token can see, every value
# riding on an item, and a verdict.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .dev.vars ]; then
  echo "No .dev.vars file found in $(pwd)" >&2
  exit 1
fi

set -a; source ./.dev.vars; set +a

if [ -z "${SQUARE_ACCESS_TOKEN:-}" ] || [[ "$SQUARE_ACCESS_TOKEN" == paste_* ]]; then
  echo "SQUARE_ACCESS_TOKEN is not set for the ${SQUARE_ENV:-?} environment." >&2
  exit 1
fi

echo "environment: ${SQUARE_ENV:-unset}  base: ${SQUARE_BASE:-unset}" >&2

exec node dev/featured-check.mjs "$@"
