#!/usr/bin/env bash
# Tiny helper for hand-testing Square API calls.
#
#   ./dev/square.sh GET  /v2/locations
#   ./dev/square.sh POST /v2/catalog/search '{"object_types":["ITEM"],"include_related_objects":true}'
#
# Reads credentials from .dev.vars so the token never lands in shell history.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .dev.vars ]; then
  echo "No .dev.vars file found in $(pwd)" >&2
  exit 1
fi

set -a; source ./.dev.vars; set +a

if [ -z "${SQUARE_ACCESS_TOKEN:-}" ] || [ "$SQUARE_ACCESS_TOKEN" = "paste_your_sandbox_token_here" ]; then
  echo "SQUARE_ACCESS_TOKEN is not set in .dev.vars yet." >&2
  exit 1
fi

METHOD="${1:?usage: square.sh METHOD PATH [JSON_BODY]}"
API_PATH="${2:?usage: square.sh METHOD PATH [JSON_BODY]}"
BODY="${3:-}"

echo "→ $METHOD $SQUARE_BASE$API_PATH  (Square-Version: $SQUARE_VERSION)" >&2
echo >&2

ARGS=(-sS -X "$METHOD" "$SQUARE_BASE$API_PATH"
      -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN"
      -H "Square-Version: $SQUARE_VERSION"
      -H "Content-Type: application/json")

[ -n "$BODY" ] && ARGS+=(-d "$BODY")

if command -v jq >/dev/null 2>&1; then
  curl "${ARGS[@]}" | jq .
else
  curl "${ARGS[@]}"
fi
