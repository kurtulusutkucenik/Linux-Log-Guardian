#!/usr/bin/env bash
# Canli site SRI — CSS (curl) + JS (tarayici)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAIL=0
bash "$ROOT/scripts/website_live_css_check.sh" || FAIL=$((FAIL + 1))
bash "$ROOT/scripts/website_live_js_check.sh" || FAIL=$((FAIL + 1))
if [[ $FAIL -eq 0 ]]; then
  echo "[OK] website_live_check"
  exit 0
fi
echo "[FAIL] website_live_check ($FAIL alt kontrol)" >&2
exit 1
