#!/usr/bin/env bash
# P0/P1 laptop guvenlik checklist — tek sudo komut (kod degistirmez)
#   sudo bash scripts/apply_laptop_security_p0.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

[[ "$(id -u)" -eq 0 ]] || {
  echo "sudo ile calistirin: sudo bash scripts/apply_laptop_security_p0.sh" >&2
  exit 1
}

upsert_key() {
  local key="$1" val="$2"
  grep -q "^${key}=" "$CONF" 2>/dev/null \
    && sed -i "s|^${key}=.*|${key}=${val}|" "$CONF" \
    || echo "${key}=${val}" >>"$CONF"
}

echo "=== apply_laptop_security_p0 ==="

# 1) nginx log format + rate limit
bash "$ROOT/scripts/fix_nginx_log_format.sh"

# 2) inline consult (en buyuk savunma kazanci)
bash "$ROOT/scripts/fix_nginx_inline_consult.sh"

# 3) FP trust prod + FP_TRUST_DAYS
upsert_key FP_TRUST_DAYS 30
upsert_key INCIDENT_MIN_LOG_HITS 3
upsert_key AUTO_BAN_MIN_RISK 60
upsert_key OPENAPI_STRICT 1
echo "[OK] rules.conf tuning (FP_TRUST_DAYS=30, incident/ban esikleri)"

best="$ROOT/data/fp-trust.lst"
for c in "$ROOT/data/fp-trust-warmup.lst" "$ROOT/data/fp-trust.lst"; do
  [[ -f "$c" ]] || continue
  n=$(wc -l <"$c" | tr -d ' ')
  bn=$(wc -l <"$best" 2>/dev/null | tr -d ' ' || echo 0)
  [[ "$n" -gt "$bn" ]] && best="$c"
done
bash "$ROOT/scripts/install_fp_trust_prod.sh" "$best" || {
  echo "[SKIP] fp-trust prod store korundu (kaynak daha kucuk veya zaten guncel)"
}

# 4) WHITELIST — LAN IP (monitoring/fleet)
LAN=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -n "$LAN" && "$LAN" != "127.0.0.1" ]]; then
  if ! grep -q "^WHITELIST_IP=${LAN}$" "$CONF" 2>/dev/null; then
    echo "WHITELIST_IP=${LAN}" >>"$CONF"
    echo "[OK] WHITELIST_IP=${LAN}"
  fi
fi

# 5) API guvenlik + servis
bash "$ROOT/scripts/ensure_api_security.sh"
systemctl restart log-guardian.service
sleep 3

# 6) ban DB budama (threat intel sismesi)
if command -v log-guardian >/dev/null; then
  DB=$(grep '^DB_PATH=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || echo /etc/log-guardian/events.db)
  prune_out=$(log-guardian ban-db-prune --db "$DB" 2>/dev/null || true)
  pruned=$(echo "$prune_out" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('pruned',0))" 2>/dev/null || echo 0)
  echo "[OK] ban-db-prune: ${pruned} satir silindi"
fi

echo ""
echo "[OK] apply_laptop_security_p0 tamam"
echo "  JWT + audit cron (sudo gerekmez): APPLY=1 bash scripts/laptop_security_excellence.sh"
echo "  dogrulama: bash scripts/local_security_audit.sh"
