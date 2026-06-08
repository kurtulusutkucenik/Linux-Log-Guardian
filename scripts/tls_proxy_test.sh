#!/usr/bin/env bash
# TLS reverse proxy smoke test (Caddy + dashboard)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[tls_proxy_test] FAIL: $*" >&2; exit 1; }

DOMAIN="${DOMAIN:-localhost}"
BASE="https://${DOMAIN}:${HTTPS_PORT:-8443}"
HTTP_BASE="http://${DOMAIN}:${HTTP_PORT:-8080}"
CURL=(curl -sfk --max-time 15)

if ! docker compose -f docker-compose.prod.yml ps --status running 2>/dev/null | grep -q caddy; then
  echo "[tls_proxy_test] Stack ayakta degil — baslatiliyor..."
  bash scripts/tls_proxy_up.sh
  sleep 8
fi

echo "[1] HTTPS /api/tier"
"${CURL[@]}" "${BASE}/api/tier" | grep -q '"tier"' || fail "tier API HTTPS"

echo "[2] HTTP -> HTTPS redirect"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${HTTP_BASE}/" || true)
[[ "$code" == "301" || "$code" == "308" || "$code" == "302" ]] || \
  fail "HTTP redirect bekleniyordu, alindi: $code"

echo "[3] Security headers"
headers=$("${CURL[@]}" -D - -o /dev/null "${BASE}/api/tier" 2>/dev/null || true)
echo "$headers" | grep -qi 'strict-transport-security' || fail "HSTS yok"
echo "$headers" | grep -qi 'x-frame-options' || fail "X-Frame-Options yok"

echo "[4] Dashboard port disarida kapali (yalnizca Caddy)"
port_out=$(docker port log-guardian-dashboard 3000 2>/dev/null || true)
if echo "$port_out" | grep -qE '0\.0\.0\.0|\[::\]:'; then
  fail "dashboard:3000 dis aga acik: $port_out"
fi
if echo "$port_out" | grep -q . && ! echo "$port_out" | grep -qE '^127\.0\.0\.1:'; then
  fail "dashboard:3000 beklenmeyen bind: $port_out"
fi

echo "[OK] tls_proxy_test"
