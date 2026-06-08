#!/usr/bin/env bash
# nginx TLS :443 hazir mi? (JA3 live proof on kontrol)
#   bash scripts/check_nginx_tls_443.sh
set -euo pipefail

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-443}"

fail() { echo "[check_nginx_tls_443] FAIL: $*" >&2; exit 1; }

command -v openssl >/dev/null 2>&1 || fail "openssl yok"

echo "=== check_nginx_tls_443 ==="
echo "  hedef=${HOST}:${PORT}"

if timeout 4 openssl s_client -connect "${HOST}:${PORT}" -servername localhost </dev/null 2>/dev/null \
   | grep -qE "BEGIN CERTIFICATE|SSL-Session"; then
  echo "[OK] TLS :${PORT} yanit veriyor"
  exit 0
fi

echo "[FAIL] TLS :${PORT} kapali veya self-signed probe basarisiz" >&2
echo "       sudo bash scripts/nginx_tls_local_setup.sh" >&2
echo "       sudo systemctl restart log-guardian-daemon log-guardian" >&2
exit 1
