#!/usr/bin/env bash
# Canli sitede tarayici SRI (Cloudflare Auto Minify JS SRI kirar)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${LG_WEBSITE_SMOKE_VENV:-$ROOT/.venv-website-smoke}"
PY="$VENV/bin/python"

if [[ ! -x "$PY" ]] || ! "$PY" -c "import playwright" 2>/dev/null; then
  echo "[website_live_js_check] SKIP — playwright yok ($VENV); pip install playwright && playwright install chromium" >&2
  exit 0
fi

# Chromium binary yoksa CSS parity yeterli (gate css_ok ile devam eder)
if ! "$PY" -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    b.close()
" 2>/dev/null; then
  echo "[website_live_js_check] SKIP — chromium yok; once: $VENV/bin/playwright install chromium" >&2
  exit 0
fi

exec "$PY" "$ROOT/scripts/website_live_js_check.py"
