#!/usr/bin/env bash
# Playwright i18n smoke — domain gerekmez (venv + chromium otomatik)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="${LG_WEBSITE_SMOKE_VENV:-$ROOT/.venv-website-smoke}"
PY="$VENV/bin/python"
PW="$VENV/bin/playwright"

ensure_venv() {
  if [[ ! -x "$PY" ]]; then
    echo "[website_i18n_browser_smoke] venv kuruluyor: $VENV"
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --upgrade pip
  fi
  if ! "$PY" -c "import playwright" 2>/dev/null; then
    echo "[website_i18n_browser_smoke] playwright paketi kuruluyor..."
    "$VENV/bin/pip" install --quiet playwright
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
  echo "[website_i18n_browser_smoke] chromium indiriliyor (ilk sefer ~1-2 dk)..."
  "$PW" install chromium
  "$PY" -c "
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    exe = Path(pw.chromium.executable_path)
    if not exe.is_file():
        raise SystemExit('[website_i18n_browser_smoke] chromium kurulamadi')
"
}

ensure_venv
ensure_browsers
bash "$ROOT/scripts/website_ensure_deploy.sh" >/dev/null
exec "$PY" "$ROOT/scripts/website_i18n_browser_smoke.py"
