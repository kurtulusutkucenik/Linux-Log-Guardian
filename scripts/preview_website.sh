#!/usr/bin/env bash
# Statik landing onizleme (guvenli localhost sunucu)
#   bash scripts/sync_evidence_pack.sh
#   bash scripts/preview_website.sh
#   → http://127.0.0.1:8765/
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "${LG_WEBSITE_PREVIEW:-source}" == "deploy" ]]; then
  bash "$ROOT/scripts/website_ensure_deploy.sh"
  SITE="$ROOT/assets/website-deploy"
else
  SITE="$ROOT/assets/website"
fi
PORT="${LG_WEBSITE_PORT:-8765}"
HOST="${LG_WEBSITE_HOST:-127.0.0.1}"

[[ -f "$SITE/index.html" ]] || { echo "[preview_website] FAIL: $SITE/index.html yok" >&2; exit 1; }

bash "$ROOT/scripts/website_security_check.sh" || {
  echo "[preview_website] Guvenlik kapisi FAIL — once: bash scripts/website_build.sh" >&2
  exit 1
}

if [[ ! -f "$SITE/evidence/competitive-proof.json" ]]; then
  echo "[preview_website] Kanit yok — once: bash scripts/sync_evidence_pack.sh" >&2
fi

if ! grep -q 'integrity=' "$SITE/index.html" 2>/dev/null; then
  bash "$ROOT/scripts/website_refresh_sri.sh" 2>/dev/null || true
fi

echo "[preview_website] http://${HOST}:${PORT}/"
echo "  Kaynak: ${SITE#$ROOT/}"
if fuser "${PORT}/tcp" >/dev/null 2>&1; then
  echo "  [WARN] port ${PORT} mesgul — bash scripts/website_kill_ports.sh" >&2
fi
echo "  Guvenlik: dizin listesi kapali, CSP basliklari, yalnizca ${HOST}"
echo "  Kanit: http://${HOST}:${PORT}/evidence/competitive-proof.pdf"
echo "  Durdurmak: Ctrl+C"
exec python3 "$ROOT/scripts/website_secure_server.py" "$SITE" --host "$HOST" --port "$PORT"
