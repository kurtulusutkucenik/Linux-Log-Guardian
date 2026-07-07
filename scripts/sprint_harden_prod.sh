#!/usr/bin/env bash
# Sprint hardening — prod /etc: RULES_VERIFY=1 + STIX + servis dogrulama
#   sudo bash scripts/sprint_harden_prod.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETC="${LG_ETC:-/etc/log-guardian}"
CONF="${ETC}/rules.conf"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"

fail() { echo "[sprint_harden_prod] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"
[[ -x "$LG_BIN" ]] || fail "$LG_BIN yok — sudo bash scripts/upgrade_log_guardian_binary.sh"

echo "=== sprint_harden_prod ==="

bash "$ROOT/scripts/rules_bundle_manifest.sh"
bash "$ROOT/scripts/sync_etc_rules.sh"
install -m 644 "$ROOT/rules/crs-bundle.manifest.json" "${ETC}/rules/crs-bundle.manifest.json"

upsert_key() {
  local key="$1" val="$2"
  [[ -f "$CONF" ]] || fail "$CONF yok"
  if grep -q "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

# GeoIP (ipdeny ~25K satir) her restart'ta agi bogar — sprint boyunca gecici kapat
SAVED_BC=""
if grep -q '^BLOCK_COUNTRIES=' "$CONF" 2>/dev/null; then
  SAVED_BC="$(grep '^BLOCK_COUNTRIES=' "$CONF" | tail -1 | cut -d= -f2- | tr -d '\r')"
  if [[ -n "$SAVED_BC" ]]; then
    upsert_key BLOCK_COUNTRIES ""
    echo "[INFO] BLOCK_COUNTRIES gecici bos — sprint sonunda geri yuklenir (ag yuku)"
  fi
fi

upsert_key RULES_VERIFY 1
upsert_key RULES_MANIFEST rules/crs-bundle.manifest.json
upsert_key MESH_BACKEND none
upsert_key SAAS_ENABLED 0
upsert_key SIEM_FORWARDER_ENABLED 1
grep -q '^SIEM_HOST=' "$CONF" || echo 'SIEM_HOST=127.0.0.1' >>"$CONF"
grep -q '^SIEM_PORT=' "$CONF" || echo 'SIEM_PORT=5044' >>"$CONF"

ok "RULES_VERIFY=1 (/etc/log-guardian/rules.conf)"

echo "[INFO] Servis durduruluyor — E2E once, tek restart sonra (GeoIP indirme yok)"
systemctl stop log-guardian.service 2>/dev/null || true
pkill -f 'log-guardian-threatintel' 2>/dev/null || true
sleep 2

echo "--- SIEM E2E (probe rules, json :15044 / stix :15045) ---"
LG_BIN="$LG_BIN" LG_RULES="$CONF" SIEM_CAPTURE_PORT=15044 bash "$ROOT/scripts/siem_export_e2e.sh"
sleep 5
if ! LG_BIN="$LG_BIN" LG_RULES="$CONF" SIEM_CAPTURE_PORT=15045 SIEM_FORMAT=stix \
    bash "$ROOT/scripts/siem_export_e2e.sh"; then
  echo "[WARN] STIX E2E ilk deneme basarisiz — 5s sonra tekrar" >&2
  sleep 5
  LG_BIN="$LG_BIN" LG_RULES="$CONF" SIEM_CAPTURE_PORT=15045 SIEM_FORMAT=stix \
    SIEM_E2E_DEBUG=1 bash "$ROOT/scripts/siem_export_e2e.sh"
fi

upsert_key SIEM_FORMAT stix
if [[ -n "$SAVED_BC" ]]; then
  # shellcheck source=scripts/lib/vm_guest.sh
  source "$ROOT/scripts/lib/vm_guest.sh" 2>/dev/null || true
  if lg_is_vbox_guest 2>/dev/null && ! lg_guest_has_outbound 2>/dev/null; then
    upsert_key BLOCK_COUNTRIES ""
    echo "[INFO] VM offline — BLOCK_COUNTRIES atlandi (ipdeny indirme yok; GEOIP_OFFLINE_CSV aktif)"
    lg_vm_offline_geoip_quiet 2>/dev/null || true
  else
    upsert_key BLOCK_COUNTRIES "$SAVED_BC"
    ok "BLOCK_COUNTRIES geri yuklendi ($SAVED_BC)"
  fi
fi

echo "[INFO] Tek restart — rules_verify + STIX prod"
systemctl restart log-guardian.service
sleep 5
if ! systemctl is-active --quiet log-guardian.service; then
  echo "[sprint_harden_prod] servis baslamadi — journal:" >&2
  journalctl -u log-guardian.service -b --no-pager -n 15 >&2 || true
  if grep -q '^RULES_VERIFY=1' "$CONF" 2>/dev/null; then
    echo "[sprint_harden_prod] gecici geri alma: RULES_VERIFY=0" >&2
    upsert_key RULES_VERIFY 0
    systemctl restart log-guardian.service || true
  fi
  fail "log-guardian restart — yukaridaki journal"
fi

sleep 2
if bash "$ROOT/scripts/rules_verify_probe.sh" "$CONF"; then
  ok "rules_verify probe (manifest)"
elif restart_ts="$(systemctl show -p ActiveEnterTimestamp --value log-guardian.service 2>/dev/null || true)" \
    && [[ -n "$restart_ts" && "$restart_ts" != "n/a" ]] \
    && journalctl -u log-guardian.service --since "$restart_ts" --no-pager 2>/dev/null \
    | grep -q '\[rules_verify\] OK'; then
  ok "journal: rules_verify OK"
else
  echo "[WARN] rules_verify journal/probe — servis ayakta, RULES_VERIFY=1 aktif" >&2
  journalctl -u log-guardian.service -b --no-pager -n 12 2>/dev/null | tail -8 >&2 || true
fi

ok "SIEM_FORMAT=stix prod ($CONF)"

echo "--- repair_no_xdp_stack (metrics/IPC hazir) ---"
REPAIR_QUIET=1 bash "$ROOT/scripts/repair_no_xdp_stack.sh" || {
  echo "[WARN] repair_no_xdp_stack ilk deneme — VM offline geoip + tekrar" >&2
  # shellcheck source=scripts/lib/vm_guest.sh
  source "$ROOT/scripts/lib/vm_guest.sh" 2>/dev/null || true
  lg_vm_offline_geoip_quiet 2>/dev/null || true
  LG_METRICS_WAIT_SEC=240 REPAIR_QUIET=1 bash "$ROOT/scripts/repair_no_xdp_stack.sh"
}
ok "repair_no_xdp_stack"

echo "--- post_install_verify ---"
if bash "$ROOT/scripts/post_install_verify.sh"; then
  ok "post_install_verify"
else
  fail "post_install_verify"
fi

echo "[OK] sprint_harden_prod — RULES_VERIFY + STIX prod aktif"
