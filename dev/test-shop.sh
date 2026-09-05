#!/usr/bin/env bash
# Run the shop behaviour tests against the real pages in a headless browser.
#
#   ./dev/test-shop.sh
#
# Serves the site on a spare port with a FIXTURE products.json (invented
# names and prices, so a real snapshot is never needed and never clobbered),
# drives it with Playwright, and tears everything down again. Your own
# products.json is not touched.
#
# First run downloads a headless Chromium (~150MB), so it needs normal
# network access — run it in your own terminal, not inside a sandboxed shell.

set -euo pipefail
cd "$(dirname "$0")/.."

command -v node >/dev/null || { echo "node is required" >&2; exit 1; }
if ! node -e "require.resolve('playwright')" 2>/dev/null; then
  echo "Installing playwright (first run only)…"
  npm install --no-save playwright >/dev/null
  npx playwright install chromium >/dev/null
fi

PORT="${PORT:-8899}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"; [ -n "${SRV:-}" ] && kill "$SRV" 2>/dev/null || true' EXIT

# A copy of the site, so the fixture catalog never lands next to the real one.
for f in index.html shop.html catalog.js cart.js detail.js search.js nav.js shop-render.js; do
  cp "$f" "$WORK/"
done
node dev/test-shop.mjs --emit-fixture > "$WORK/products.json"

( cd "$WORK" && python3 -m http.server "$PORT" >/dev/null 2>&1 ) &
SRV=$!
sleep 1

TEST_BASE="http://127.0.0.1:$PORT" node dev/test-shop.mjs
