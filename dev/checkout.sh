#!/usr/bin/env bash
# Create a Square-hosted checkout for one item — with a stock re-check first.
# This is the bash sketch of what /api/checkout will do in JavaScript.
#
#   ./dev/checkout.sh                  first in-stock variation in the catalog
#   ./dev/checkout.sh VARIATION_ID     a specific one

set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source ./.dev.vars; set +a

# ── PRODUCTION GUARD ─────────────────────────────────────────
# A production token creates REAL payment links against Lauren's
# live account. This script is for sandbox testing only.
if [ "${SQUARE_ENV:-}" != "sandbox" ] || [[ "$SQUARE_BASE" != *squareupsandbox* ]]; then
  echo "REFUSING: .dev.vars is not pointed at sandbox." >&2
  echo "  SQUARE_ENV  = ${SQUARE_ENV:-unset}" >&2
  echo "  SQUARE_BASE = ${SQUARE_BASE:-unset}" >&2
  echo >&2
  echo "This script creates real payment links against a production account." >&2
  echo "Switch back with: ./dev/env.sh sandbox" >&2
  exit 1
fi

req() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" "$SQUARE_BASE$path"
    -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN"
    -H "Square-Version: $SQUARE_VERSION"
    -H "Content-Type: application/json")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}"
}

CATALOG=$(req POST /v2/catalog/search '{"object_types":["ITEM"],"include_related_objects":true}')

if [ $# -ge 1 ]; then
  VARIATION_ID="$1"
else
  VARIATION_ID=$(echo "$CATALOG" | jq -r '.objects[0].item_data.variations[0].id // empty')
fi

[ -z "$VARIATION_ID" ] && { echo "Nothing in the catalog to sell."; exit 1; }

NAME=$(echo "$CATALOG" | jq -r --arg v "$VARIATION_ID" '
  .objects[]? | select(any(.item_data.variations[]?; .id==$v)) | .item_data.name')

# ── THE GUARD ────────────────────────────────────────────────
# Never create a payment link without asking Square, right now,
# whether the thing is still here. Cached browser state is not evidence.
STOCK=$(req POST /v2/inventory/counts/batch-retrieve \
  "{\"catalog_object_ids\":[\"$VARIATION_ID\"],\"location_ids\":[\"$SQUARE_LOCATION_ID\"]}")

QTY=$(echo "$STOCK" | jq -r '.counts[0].quantity // "untracked"')

echo "item      : $NAME"
echo "variation : $VARIATION_ID"
echo "in stock  : $QTY"
echo

if [ "$QTY" = "untracked" ]; then
  echo "REFUSING: stock is untracked, so Square would sell this forever."
  echo "Turn on Track stock for this item before selling it."
  exit 1
fi
if [ "$QTY" -lt 1 ] 2>/dev/null; then
  echo "REFUSING: just sold. No payment link created."
  exit 1
fi

# ── THE PAYMENT LINK ─────────────────────────────────────────
# Fresh idempotency key per attempt. Note we send an ID and a
# quantity, never a price — Square prices it from the catalog.
IDEM=$( (command -v uuidgen >/dev/null && uuidgen) || python3 -c 'import uuid;print(uuid.uuid4())' )

BODY=$(jq -n \
  --arg idem "$IDEM" \
  --arg loc "$SQUARE_LOCATION_ID" \
  --arg var "$VARIATION_ID" \
  '{ idempotency_key: $idem,
     order: {
       location_id: $loc,
       line_items: [ { catalog_object_id: $var, quantity: "1" } ]
     },
     checkout_options: {
       ask_for_shipping_address: true,
       redirect_url: "https://example.com/thank-you"
     } }')

RESP=$(req POST /v2/online-checkout/payment-links "$BODY")

URL=$(echo "$RESP" | jq -r '.payment_link.url // empty')

if [ -z "$URL" ]; then
  echo "Square said no:"; echo "$RESP" | jq .; exit 1
fi

echo "order id  : $(echo "$RESP" | jq -r '.payment_link.order_id')"
echo
echo "CHECKOUT  : $URL"
echo
echo "Open it and pay with 4111 1111 1111 1111, CVV 111, any future expiry."
echo "Then re-run ./dev/products.sh and watch the stock go to 0."
