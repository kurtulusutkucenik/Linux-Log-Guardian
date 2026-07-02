#!/usr/bin/env bash
# Playwright dashboard PNG — https://localhost:8443 (dashboard ayakta olmali)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${LG_WEBSITE_SMOKE_VENV:-$ROOT/.venv-website-smoke}"
PY="$VENV/bin/python"
PW="$VENV/bin/playwright"

ensure_venv() {
  if [[ ! -x "$PY" ]]; then
    echo "[website_dashboard_screenshots] venv kuruluyor: $VENV"
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --upgrade pip
  fi
  if ! "$PY" -c "import playwright" 2>/dev/null; then
    echo "[website_dashboard_screenshots] playwright kuruluyor..."
    "$VENV/bin/pip" install --quiet playwright pillow
  fi
}

ensure_browsers() {
  if "$PY" -c "
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    exe = Path(pw.chromium.executable_path)
    if not exe.is_file():
        raise SystemExit(1)
" 2>/dev/null; then
    return 0
  fi
  echo "[website_dashboard_screenshots] chromium indiriliyor..."
  "$PW" install chromium
}

ensure_venv
ensure_browsers
exec "$PY" "$ROOT/scripts/website_dashboard_screenshots.py" "$@"
