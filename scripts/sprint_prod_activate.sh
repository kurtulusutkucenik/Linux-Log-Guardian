#!/usr/bin/env bash
# Sprint guvenlik ayarlarini etkinlestir + dogrula
#   sudo bash scripts/sprint_prod_activate.sh          # prod /etc
#   bash scripts/sprint_prod_activate.sh                 # laptop: repo rules.conf
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETC="${LG_ETC:-/etc/log-guardian}"
CONF="${ETC}/rules.conf"
LAPTOP=0

fail() { echo "[sprint_prod_activate] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  if [[ "${LG_LAPTOP:-1}" == "1" ]]; then
    LAPTOP=1
    ETC="$ROOT"
    CONF="$ROOT/rules.conf"
    echo "[sprint_prod_activate] laptop mod — $CONF"
    echo "  (prod /etc icin: sudo bash scripts/sprint_prod_activate.sh)"
  else
    fail "sudo gerekli (laptop: bash scripts/sprint_prod_activate.sh veya LG_LAPTOP=1)"
  fi
fi

if [[ "$LAPTOP" -eq 0 ]]; then
  bash "$ROOT/scripts/sync_etc_rules.sh"
  install -d "${ETC}/rules" "${ETC}/examples"
  install -m 644 "$ROOT/rules/crs-bundle.manifest.json" "${ETC}/rules/crs-bundle.manifest.json"
  install -m 644 "$ROOT/examples/geoip-offline-sample.csv" "${ETC}/examples/geoip-offline-sample.csv"
  [[ -f "$CONF" ]] || install -m 600 "$ROOT/rules.conf" "$CONF"
else
  [[ -f "$CONF" ]] || cp "$ROOT/rules.conf" "$CONF"
  [[ -f "$ROOT/examples/geoip-offline-sample.csv" ]] || fail "examples/geoip-offline-sample.csv yok"
fi

upsert_key() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  elif grep -q "^# ${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^# ${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

upsert_key BAN_MAX_AUTO_PER_MIN 60
upsert_key RULES_MANIFEST rules/crs-bundle.manifest.json
upsert_key GEOIP_OFFLINE_CSV examples/geoip-offline-sample.csv
upsert_key WEBHOOK_TELEGRAM_GEOIP 1
upsert_key WEBHOOK_TELEGRAM_BATCH_SEC 10
# Laptop/VM: etcd yok — [ETCD_MESH] Watch journal gurultusu onlenir
upsert_key MESH_BACKEND none
upsert_key SAAS_ENABLED 0

# Manifest hazir; prod'da acmak icin RULES_VERIFY=1 yapin
if ! grep -q '^RULES_VERIFY=' "$CONF" 2>/dev/null; then
  echo "RULES_VERIFY=0" >>"$CONF"
fi

if [[ "$LAPTOP" -eq 0 && -x "$ROOT/scripts/sync_service_password.sh" ]]; then
  bash "$ROOT/scripts/sync_service_password.sh" && ok "service.password KDF ile hizalandi" \
    || echo "[WARN] sync_service_password atlandi — sudo bash scripts/sync_service_password.sh"
fi

if [[ "$LAPTOP" -eq 0 ]]; then
  systemctl restart log-guardian.service 2>/dev/null || true
  systemctl is-active --quiet log-guardian.service && ok "log-guardian.service active" \
    || echo "[WARN] log-guardian.service inactive (CLI-only mod olabilir)"
fi

grep -q '^BAN_MAX_AUTO_PER_MIN=60' "$CONF" && ok "BAN_MAX_AUTO_PER_MIN=60"
grep -q '^GEOIP_OFFLINE_CSV=' "$CONF" && ok "GEOIP_OFFLINE_CSV aktif"
grep -q '^WEBHOOK_TELEGRAM_GEOIP=1' "$CONF" && ok "WEBHOOK_TELEGRAM_GEOIP=1"
grep -q '^WEBHOOK_TELEGRAM_BATCH_SEC=10' "$CONF" && ok "WEBHOOK_TELEGRAM_BATCH_SEC=10 (P2 batch)"
grep -q '^MESH_BACKEND=none' "$CONF" && ok "MESH_BACKEND=none (etcd journal kapali)"
[[ -f "${ETC}/rules/crs-bundle.manifest.json" ]] && ok "manifest /etc"

echo "[OK] sprint_prod_activate"
if [[ "$LAPTOP" -eq 1 ]]; then
  echo "  GeoIP: ./log-guardian -c rules.conf ... ile test edin"
  echo "  prod:  sudo bash scripts/sprint_prod_activate.sh && sudo bash scripts/sprint_harden_prod.sh"
else
  echo "  sonraki: sudo bash scripts/sprint_harden_prod.sh"
fi
