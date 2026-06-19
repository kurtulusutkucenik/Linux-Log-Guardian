#!/usr/bin/env bash
# OpenAPI strict prod — BOLA/IDOR (API barindiran hostlar)
#   sudo bash scripts/install_openapi_strict_prod.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
SCHEMA_DST="/etc/log-guardian/openapi.yaml"
SCHEMA_SRC="$ROOT/examples/openapi/petstore-v3.yaml"

[[ "$(id -u)" -eq 0 ]] || { echo "[openapi_strict] sudo gerekli" >&2; exit 1; }
[[ -f "$SCHEMA_SRC" ]] || { echo "[openapi_strict] sema yok: $SCHEMA_SRC" >&2; exit 1; }

install -d /etc/log-guardian
install -m 644 "$SCHEMA_SRC" "$SCHEMA_DST"

set_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

set_kv OPENAPI_STRICT 1
set_kv OPENAPI_SCHEMA_PATH "$SCHEMA_DST"
set_kv SCHEMA_BOLA_MIN_SCORE 80
chmod 600 "$CONF" 2>/dev/null || true

systemctl restart log-guardian 2>/dev/null || true
echo "[OK] install_openapi_strict_prod — docs/OPENAPI_STRICT_PROD.md"
echo "  dogrula: bash scripts/bola_idor_e2e.sh"
