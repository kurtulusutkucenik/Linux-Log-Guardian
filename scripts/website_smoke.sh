#!/usr/bin/env bash
# Domain olmadan deploy paketi HTTP + baslik smoke testi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="${1:-$ROOT/assets/website-deploy}"
HOST="${LG_WEBSITE_HOST:-127.0.0.1}"
FAIL=0

bad() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
ok() { echo "  [OK] $*"; }
die() { echo "[website_smoke] FAIL: $*" >&2; exit 1; }

[[ -d "$SITE" ]] || die "$SITE yok — once website_deploy_gate"

bash "$ROOT/scripts/website_ensure_deploy.sh" >/dev/null

PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"

echo "=== website_smoke ==="
echo "  Site: ${SITE#$ROOT/}"
echo "  Port: ${PORT} (bos port — cakisma yok)"

python3 "$ROOT/scripts/website_secure_server.py" "$SITE" --host "$HOST" --port "$PORT" &
srv_pid=$!
cleanup() {
  kill -TERM "$srv_pid" 2>/dev/null || true
  sleep 0.2
  kill -KILL "$srv_pid" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 50); do
  sleep 0.1
  if ! kill -0 "$srv_pid" 2>/dev/null; then
    continue
  fi
  hdrs="$(curl -sI "http://${HOST}:${PORT}/_headers" 2>/dev/null || true)"
  if grep -qi "^X-LG-Site-Server: secure-static/1" <<< "$hdrs"; then
    ready=1
    break
  fi
done

if [[ $ready -eq 0 ]]; then
  if ! kill -0 "$srv_pid" 2>/dev/null; then
    die "guvenli sunucu baslatilamadi — python3 scripts/website_secure_server.py \"$SITE\" --port $PORT"
  fi
  die "guvenli sunucu dogrulanamadi (port ${PORT}). 8767 gibi sabit portta baska servis olabilir."
fi
ok "guvenli sunucu dogrulandi"

check_code() {
  local path="$1" expect="$2"
  local got hdrs
  got="$(curl -s -o /dev/null -w "%{http_code}" "http://${HOST}:${PORT}${path}")"
  hdrs="$(curl -sI "http://${HOST}:${PORT}${path}" 2>/dev/null || true)"
  if ! grep -qi "^X-LG-Site-Server: secure-static/1" <<< "$hdrs"; then
    bad "${path} yanlis sunucu (X-LG-Site-Server yok)"
    return
  fi
  if [[ "$got" == "$expect" ]]; then
    ok "${path} -> ${got}"
  else
    bad "${path} beklenen ${expect}, gelen ${got}"
  fi
}

check_code "/" 200
check_code "/site.css" 200
check_code "/i18n.js" 200
check_code "/csp.txt" 403
check_code "/publish.allowlist" 403
check_code "/_headers" 403
check_code "/_redirects" 403
check_code "/.env" 403
check_code "/.git/config" 403
check_code "/wp-admin/" 403
check_code "/admin/" 403
check_code "/deploy-manifest.json" 403
check_code "/.well-known/gpc.json" 200
check_code "/.well-known/security.txt" 200
check_code "/evidence/competitive-proof.pdf" 200
check_code "/404.html" 200

headers="$(curl -sI "http://${HOST}:${PORT}/")"
if ! grep -qi "^X-LG-Site-Server: secure-static/1" <<< "$headers"; then
  bad "ana sayfa yanlis sunucudan"
else
  ok "X-LG-Site-Server fingerprint"
fi

for h in Content-Security-Policy X-Frame-Options X-Content-Type-Options Referrer-Policy; do
  if grep -qi "^${h}:" <<< "$headers"; then
    ok "header ${h}"
  else
    bad "header ${h} eksik"
  fi
done

csp="$(grep -i "^Content-Security-Policy:" <<< "$headers" | head -1)"
if grep -q "base-uri 'none'" <<< "$csp" && grep -q "require-trusted-types-for" <<< "$csp"; then
  ok "CSP sertlestirme"
else
  bad "CSP sertlestirme eksik"
fi

if [[ $FAIL -eq 0 ]]; then
  echo "[OK] website_smoke"
  exit 0
fi
echo "[FAIL] website_smoke ($FAIL hata)"
exit 1
