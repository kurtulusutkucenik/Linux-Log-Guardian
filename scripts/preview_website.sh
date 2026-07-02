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

pick_free_port() {
  python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
}

preview_css_href() {
  grep -oP 'href="/(site[^"]+\.css)"' "$SITE/index.html" 2>/dev/null | head -1 | sed 's/href="//;s/"//'
}

probe_css_ok() {
  local base="$1"
  local css
  css="$(preview_css_href)"
  [[ -n "$css" ]] || return 1
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" -H "Sec-Fetch-Dest: style" "${base%/}/${css}" 2>/dev/null || echo 000)"
  [[ "$code" == "200" ]]
}

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
elif [[ "$SITE" == "$ROOT/assets/website" ]] && [[ -f "$SITE/i18n.js" ]]; then
  exp="$(grep -oP 'lg-integrity-i18n" content="\K[^"]+' "$SITE/index.html" 2>/dev/null | head -1 || true)"
  act="sha384-$(openssl dgst -sha384 -binary "$SITE/i18n.js" | openssl base64 -A)"
  if [[ -n "$exp" && "$exp" != "$act" ]]; then
    echo "[preview_website] SRI drift (i18n.js) — website_refresh_sri.sh calistiriliyor" >&2
    bash "$ROOT/scripts/website_refresh_sri.sh" >&2
  fi
fi

if fuser "${PORT}/tcp" >/dev/null 2>&1; then
  bash "$ROOT/scripts/website_kill_ports.sh" >/dev/null 2>&1 || true
  sleep 0.3
fi
if pgrep -f 'website_secure_server\.py' >/dev/null 2>&1; then
  pkill -f 'website_secure_server\.py' 2>/dev/null || true
  sleep 0.4
fi
STALE_PORT=""
if fuser "${PORT}/tcp" >/dev/null 2>&1; then
  if ! probe_css_ok "http://${HOST}:${PORT}"; then
    STALE_PORT="$PORT"
  fi
  busy="$PORT"
  PORT="$(pick_free_port)"
  echo "  [WARN] port ${busy} mesgul veya eski — http://${HOST}:${PORT}/ kullaniliyor" >&2
fi

URL="http://${HOST}:${PORT}/"
printf '%s\n' "$URL" >"$ROOT/.website-preview.url"

echo ""
echo "=============================================="
echo "  ONIZLEME: ${URL}"
if [[ -n "$STALE_PORT" ]]; then
  echo ""
  echo "  !!! ${HOST}:${STALE_PORT} ESKİ sunucu (CSS yuklenmiyor) — KAPAT !!!"
  echo "  !!! Yalnizca yukaridaki URL'yi ac (Ctrl+Shift+R)              !!!"
fi
echo "  Eski 127.0.0.1 sekmelerini kapat — yalnizca bu port."
echo "  URL dosyasi: .website-preview.url"
echo "=============================================="
echo ""
echo "[preview_website] ${URL}"
echo "  Kaynak: ${SITE#$ROOT/}"
echo "  Guvenlik: dizin listesi kapali, CSP basliklari, yalnizca ${HOST}"
echo "  Kanit: http://${HOST}:${PORT}/evidence/competitive-proof.pdf"
echo "  Durdurmak: Ctrl+C"
exec python3 "$ROOT/scripts/website_secure_server.py" "$SITE" --host "$HOST" --port "$PORT"
