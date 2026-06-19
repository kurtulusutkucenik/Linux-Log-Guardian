#!/usr/bin/env bash
# /etc/log-guardian/rules.conf — threat intel prod anahtarlari
#   sudo bash scripts/merge_threat_intel_prod.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/merge_threat_intel_prod.sh" >&2
  exit 1
fi

if [[ ! -f "$CONF" ]]; then
  install -d /etc/log-guardian
  install -m 600 "$ROOT/rules.conf" "$CONF"
  echo "[OK] rules.conf kuruldu: $CONF"
fi

patch_kv() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

patch_kv INTEL_BAN_DB_TTL_DAYS 7
patch_kv THREAT_INTEL_PROD 1

KDF='ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504'
if ! grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$[0-9]+\$[0-9a-fA-F]+\$[0-9a-fA-F]{64}' "$CONF" 2>/dev/null; then
  sed -i '/^ACCESS_PASSWORD_KDF=/d' "$CONF" 2>/dev/null || true
  sed -i '/^ACCESS_PASSWORD_HASH=/d' "$CONF" 2>/dev/null || true
  printf '\n%s\n' "$KDF" >>"$CONF"
  echo "[OK] ACCESS_PASSWORD_KDF eklendi"
fi
getent group log-guardian >/dev/null 2>&1 && chown root:log-guardian "$CONF" 2>/dev/null || true
chmod 640 "$CONF" 2>/dev/null || chmod 600 "$CONF"
echo "[OK] threat intel prod: INTEL_BAN_DB_TTL_DAYS=7 THREAT_INTEL_PROD=1"
