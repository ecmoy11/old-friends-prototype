#!/usr/bin/env bash
# Refresh products.json from Square for the static GitHub Pages preview.
#
#   ./dev/snapshot.sh            fetch and write products.json
#   ./dev/snapshot.sh --dry-run  fetch and report, write nothing
#
# The live site never reads this file — it calls /api/products. This exists
# so the Pages preview shows Lauren's real catalog instead of hand-written
# HTML. Read-only against Square; safe to run against production.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .dev.vars ]; then
  echo "No .dev.vars file found in $(pwd)" >&2
  exit 1
fi

set -a; source ./.dev.vars; set +a

if [ -z "${SQUARE_ACCESS_TOKEN:-}" ] || [[ "$SQUARE_ACCESS_TOKEN" == paste_* ]]; then
  echo "SQUARE_ACCESS_TOKEN is not set for the ${SQUARE_ENV:-?} environment." >&2
  echo "Edit .dev.vars.${SQUARE_ENV:-sandbox} and paste the token from the Credentials page." >&2
  exit 1
fi

if [ "${SQUARE_ENV:-}" != "production" ]; then
  echo "NOTE: active environment is '${SQUARE_ENV:-unset}', not production." >&2
  echo "The committed preview should come from Lauren's real catalog: ./dev/env.sh production" >&2
  echo >&2
fi

exec node dev/snapshot.mjs "$@"
