#!/usr/bin/env bash
# Canli sitede tarayici SRI (Cloudflare Auto Minify JS SRI kirar)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${LG_WEBSITE_SMOKE_VENV:-$ROOT/.venv-website-smoke}"
PY="$VENV/bin/python"

if [[ ! -x "$PY" ]] || ! "$PY" -c "import playwright" 2>/dev/null; then
  bash "$ROOT/scripts/website_i18n_browser_smoke.sh" 2>/dev/null || true
fi

exec "$PY" "$ROOT/scripts/website_live_js_check.py"
