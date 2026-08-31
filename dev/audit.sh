#!/usr/bin/env bash
# Catalog health check. Answers "what is actually in Square, and what
# state is it in" before we decide what belongs on the website.
#
#   ./dev/audit.sh            summary counts + the problem lists
#   ./dev/audit.sh --csv      one row per item, for a spreadsheet

set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source ./.dev.vars; set +a

req() {
  curl -sS -X "$1" "$SQUARE_BASE$2" \
    -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
    -H "Square-Version: $SQUARE_VERSION" \
    -H "Content-Type: application/json" \
    ${3:+-d "$3"}
}

CATALOG=$(req POST /v2/catalog/search \
  '{"object_types":["ITEM","CATEGORY"],"include_related_objects":true}')

VAR_IDS=$(echo "$CATALOG" | jq -c '[.objects[]? | select(.type=="ITEM") | .item_data.variations[]?.id]')
STOCK=$(req POST /v2/inventory/counts/batch-retrieve \
  "{\"catalog_object_ids\":$VAR_IDS,\"location_ids\":[\"$SQUARE_LOCATION_ID\"]}")

JOINED=$(jq -n --argjson c "$CATALOG" --argjson s "$STOCK" '
  ([($s.counts // [])[] | select(.state=="IN_STOCK") | {(.catalog_object_id): (.quantity|tonumber)}] | add // {}) as $qty |
  ([(($c.objects // []) + ($c.related_objects // []))[]
     | select(.type=="CATEGORY")
     | {(.id): .category_data.name}] | add // {}) as $cats |
  [ ($c.objects // [])[] | select(.type=="ITEM")
    | .item_data as $it
    | { name: $it.name,
        ecom: ($it.ecom_visibility // "(absent)"),
        archived: ($it.is_archived // false),
        category: ($cats[$it.category_id // ""] // ($it.reporting_category.id // "" | $cats[.]) // null),
        has_image: (($it.image_ids // []) | length > 0),
        has_desc: (($it.description // "") | length > 0),
        variations: (($it.variations // []) | length),
        priced: (($it.variations // []) | map(.item_variation_data.price_money.amount) | map(select(. != null)) | length),
        tracked: (($it.variations // []) | map(.item_variation_data.track_inventory == true) | any),
        in_stock: (($it.variations // []) | map($qty[.id] // 0) | add // 0) } ]')

if [ "${1:-}" = "--csv" ]; then
  echo "$JOINED" | jq -r '["name","category","ecom_visibility","in_stock","variations","priced","tracked","has_image","has_desc"],
    (.[] | [.name,(.category//""),.ecom,.in_stock,.variations,.priced,.tracked,.has_image,.has_desc]) | @csv'
  exit 0
fi

echo "$JOINED" | jq -r '
  "TOTAL ITEMS IN SQUARE      : \(length)",
  "  with at least one in stock: \([.[]|select(.in_stock>0)]|length)",
  "  everything sold out       : \([.[]|select(.in_stock==0 and .tracked)]|length)",
  "  inventory NOT tracked     : \([.[]|select(.tracked|not)]|length)",
  "  missing a photo           : \([.[]|select(.has_image|not)]|length)",
  "  missing a description     : \([.[]|select(.has_desc|not)]|length)",
  "  missing a price           : \([.[]|select(.priced < .variations)]|length)",
  "  multi-variation           : \([.[]|select(.variations>1)]|length)",
  "",
  "SQUARE ONLINE VISIBILITY (ecom_visibility):",
  ( [.[].ecom] | group_by(.) | map("  \(.[0]): \(length)") | .[] ),
  "",
  "WOULD APPEAR ON THE SITE (ecom_visibility = VISIBLE):",
  ( [.[]|select(.ecom=="VISIBLE")|"  \(.name)  [stock \(.in_stock)]"] | .[] ),
  "",
  "CATEGORIES SQUARE REPORTS:",
  ( [.[].category] | map(. // "(none)") | group_by(.) | map("  \(.[0]): \(length)") | .[] ),
  "",
  "READY TO PUBLISH — complete, in stock, but NOT on the website:",
  "(photo + description + price + tracked stock. Lauren just flips these to Visible.)",
  ( [.[]|select(.ecom!="VISIBLE" and .has_image and .has_desc and .tracked
                and .in_stock>0 and .priced==.variations)
       |"  \(.name)  [stock \(.in_stock)]"] | .[] ),
  "",
  "ALMOST READY — in stock, but missing something:",
  ( [.[]|select(.ecom!="VISIBLE" and .tracked and .in_stock>0
                and ((.has_image|not) or (.has_desc|not) or .priced!=.variations))
       |"  \(.name)  — missing\(if .has_image|not then " photo" else "" end)\(if .has_desc|not then " description" else "" end)\(if .priced!=.variations then " price" else "" end)"] | .[] ),
  "",
  "NOT TRACKED (would show Unavailable on the site):",
  ( [.[]|select(.tracked|not)|"  \(.name)"] | .[] ),
  "",
  "NO PHOTO:",
  ( [.[]|select(.has_image|not)|"  \(.name)"] | .[] ),
  "",
  "NO PRICE:",
  ( [.[]|select(.priced < .variations)|"  \(.name)"] | .[] )'
