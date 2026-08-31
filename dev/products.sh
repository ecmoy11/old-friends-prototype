#!/usr/bin/env bash
# The whole product feed, in two calls, joined on variation ID.
# This is a bash sketch of what /api/products will do in JavaScript later.
#
#   ./dev/products.sh          pretty summary
#   ./dev/products.sh --raw    the full untouched JSON from both calls

set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source ./.dev.vars; set +a

req() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$SQUARE_BASE$path" \
      -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
      -H "Square-Version: $SQUARE_VERSION" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -sS -X "$method" "$SQUARE_BASE$path" \
      -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
      -H "Square-Version: $SQUARE_VERSION" \
      -H "Content-Type: application/json"
  fi
}

# Fail early and readably rather than letting jq choke on an error object.
if [ -z "${SQUARE_ACCESS_TOKEN:-}" ] || [[ "$SQUARE_ACCESS_TOKEN" == paste_* ]]; then
  echo "SQUARE_ACCESS_TOKEN is not set for the $SQUARE_ENV environment." >&2
  echo "Edit .dev.vars.$SQUARE_ENV and paste the token from the Credentials page." >&2
  exit 1
fi
if [ -z "${SQUARE_LOCATION_ID:-}" ]; then
  echo "SQUARE_LOCATION_ID is blank for the $SQUARE_ENV environment." >&2
  echo >&2
  echo "Find it with:" >&2
  echo "    ./dev/square.sh GET /v2/locations" >&2
  echo "then put the \"id\" into .dev.vars.$SQUARE_ENV" >&2
  exit 1
fi

# CALL 1 — what products exist, with their photos
CATALOG=$(req POST /v2/catalog/search \
  '{"object_types":["ITEM"],"include_related_objects":true}')

if echo "$CATALOG" | jq -e '.errors' >/dev/null 2>&1; then
  echo "Square rejected the catalog request:" >&2
  echo "$CATALOG" | jq '.errors' >&2
  exit 1
fi

VAR_IDS=$(echo "$CATALOG" | jq -c '[.objects[]?.item_data.variations[]?.id]')

if [ "$VAR_IDS" = "[]" ]; then
  echo "No items in the catalog yet."
  exit 0
fi

# CALL 2 — how many of each are left
STOCK=$(req POST /v2/inventory/counts/batch-retrieve \
  "{\"catalog_object_ids\":$VAR_IDS,\"location_ids\":[\"$SQUARE_LOCATION_ID\"]}")

if echo "$STOCK" | jq -e '.errors' >/dev/null 2>&1; then
  echo "Square rejected the inventory request:" >&2
  echo "$STOCK" | jq '.errors' >&2
  exit 1
fi

if [ "${1:-}" = "--raw" ]; then
  echo "===== CALL 1: catalog ====="; echo "$CATALOG" | jq .
  echo "===== CALL 2: inventory ====="; echo "$STOCK" | jq .
  exit 0
fi

# THE JOIN — variation ID is the key that links them
jq -n --argjson c "$CATALOG" --argjson s "$STOCK" '
  ([($s.counts // [])[] | {(.catalog_object_id): .quantity}] | add // {}) as $qty |
  ([($c.related_objects // [])[]
     | select(.type=="IMAGE")
     | {(.id): .image_data.url}] | add // {}) as $img |
  [ ($c.objects // [])[]
    | .id as $item_id
    | .item_data as $it
    | { name: $it.name,
        item_id: $item_id,
        description: ($it.description // null),
        image: ((($it.image_ids // [])[0]) as $i | if $i == null then null else ($img[$i] // null) end),
        variations: [ ($it.variations // [])[]
          | { variation_id: .id,
              variation_name: (.item_variation_data.name // null),
              price_cents: (.item_variation_data.price_money.amount // null),
              price_display: (if .item_variation_data.price_money.amount
                              then "$" + ((.item_variation_data.price_money.amount / 100)|tostring)
                              else "no price" end),
              in_stock: ($qty[.id] // "untracked") } ] } ]'
