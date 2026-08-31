#!/usr/bin/env bash
# Switch .dev.vars between the sandbox and production Square accounts.
#
#   ./dev/env.sh              show which one is active
#   ./dev/env.sh sandbox      switch to sandbox
#   ./dev/env.sh production   switch to production  (READ-ONLY work only)
#
# Keeps each account's settings in .dev.vars.sandbox / .dev.vars.production
# (both gitignored) and points .dev.vars at one of them with a symlink, so
# switching never means retyping a token and editing the real file just works.

set -euo pipefail
cd "$(dirname "$0")/.."

show() {
  if [ ! -f .dev.vars ]; then echo "No .dev.vars"; exit 1; fi
  local env base loc
  env=$(grep -E '^SQUARE_ENV=' .dev.vars | cut -d= -f2- || echo "unset")
  base=$(grep -E '^SQUARE_BASE=' .dev.vars | cut -d= -f2- || echo "unset")
  loc=$(grep -E '^SQUARE_LOCATION_ID=' .dev.vars | cut -d= -f2- || echo "unset")
  echo "active   : $env"
  echo "base url : $base"
  echo "location : $loc"
  if [ "$env" = "production" ]; then
    echo
    echo "*** PRODUCTION — this is Lauren's real account. ***"
    echo "Reads are safe. dev/checkout.sh will refuse to run."
  fi
}

case "${1:-show}" in
  show) show ;;
  sandbox|production)
    target=".dev.vars.$1"
    if [ ! -f "$target" ]; then
      echo "Missing $target — create it first (copy .dev.vars and fill in that account's values)." >&2
      exit 1
    fi
    ln -sfn "$target" .dev.vars
    echo "Switched to $1.  (.dev.vars -> $target)"
    echo "Edits to $target now take effect immediately."
    echo
    show
    ;;
  *) echo "usage: ./dev/env.sh [show|sandbox|production]" >&2; exit 1 ;;
esac
