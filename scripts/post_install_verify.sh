#!/usr/bin/env bash
# Kurulum sonrasi tek komut yesil/kirmizi matris
#   bash scripts/post_install_verify.sh
#   sudo bash scripts/post_install_verify.sh   # canli API + health
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# .deb kurulumu: scriptler /usr/local/share/log-guardian/scripts/
LG_SHARE="/usr/local/share/log-guardian"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$REPO" != "$LG_SHARE" && -d "$REPO/scripts" ]]; then
  SCRIPTS="$REPO/scripts"
elif [[ -d "$LG_SHARE/scripts" && -x "$LG_SHARE/scripts/ensure_api_security.sh" ]]; then
  SCRIPTS="$LG_SHARE/scripts"
else
  SCRIPTS="$REPO/scripts"
fi
LIB="$SCRIPTS/lib/rules_conf_read.sh"
[[ -f "$LIB" ]] || LIB="$REPO/scripts/lib/rules_conf_read.sh"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$LIB"

fail=0
warn=0
fail_lines=()

ok()   { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
bad()  { echo "[FAIL] $*"; fail=$((fail + 1)); fail_lines+=("$*"); }

echo "=== post_install_verify ==="
echo ""

# Grup uyeligi var ama shell'de aktif degilse (VM'de sik) — vm_demo_gate ile ayni
if [[ $EUID -ne 0 && -z "${LG_VERIFY_IN_SG:-}" ]] \
    && getent group log-guardian >/dev/null 2>&1 \
    && id -nG 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
  export LG_VERIFY_IN_SG=1
  exec sg log-guardian -c "bash \"$ROOT/scripts/post_install_verify.sh\""
fi

metrics_reachable() {
  curl -sf --max-time 3 http://127.0.0.1:9091/metrics >/dev/null 2>&1
}

api_fail_closed_ok() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    http://127.0.0.1:8090/api/v1/metrics 2>/dev/null || echo 000)
  [[ "$code" == "403" ]]
}

# --- Binary + systemd ---
if [[ -x /usr/local/bin/log-guardian ]]; then
  ok "binary /usr/local/bin/log-guardian"
else
  bad "binary yok — sudo bash install.sh"
fi

if systemctl is-active log-guardian >/dev/null 2>&1; then
  ok "log-guardian.service active"
else
  bad "log-guardian.service inactive"
fi

if systemctl is-active log-guardian-daemon >/dev/null 2>&1; then
  ok "log-guardian-daemon.service active"
else
  warn "log-guardian-daemon inactive (laptop OK)"
fi

# --- Health (IPC) ---
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
HEALTH_BIN="${SOAK_HEALTH_BIN:-/usr/local/bin/log-guardian}"
DB="${SOAK_HEALTH_DB:-/etc/log-guardian/events.db}"
health_ok=0
_run_health() {
  "$HEALTH_BIN" --health --db "$DB" >/dev/null 2>&1
}
_run_health_sg() {
  sg log-guardian -c "exec \"$HEALTH_BIN\" --health --db \"$DB\"" >/dev/null 2>&1
}
_try_health_once() {
  if _run_health; then return 0; fi
  if getent group log-guardian >/dev/null 2>&1 && _run_health_sg; then return 0; fi
  if [[ $EUID -eq 0 && -n "${SUDO_USER:-}" && "${SUDO_USER}" != root ]]; then
    runuser -u "$SUDO_USER" -- sg log-guardian -c "exec \"$HEALTH_BIN\" --health --db \"$DB\"" >/dev/null 2>&1 \
      && return 0
  fi
  [[ $EUID -eq 0 ]] && _run_health_sg && return 0
  return 1
}
if [[ -x "$HEALTH_BIN" ]]; then
  for _h in $(seq 1 8); do
    if _try_health_once; then
      health_ok=1
      break
    fi
    [[ "$_h" -lt 8 ]] && sleep 1
  done
fi
[[ "$health_ok" -eq 1 ]] && ok "--health IPC" \
  || bad "--health (sudo bash scripts/fix_ipc_perms.sh; usermod -aG log-guardian \$USER)"

# --- Metrics ---
metrics_ok=0
if metrics_reachable; then
  metrics_ok=1
else
  for _ in $(seq 1 8); do
    sleep 1
    if metrics_reachable; then
      metrics_ok=1
      break
    fi
  done
fi
if [[ "$metrics_ok" -eq 1 ]]; then
  ok "metrics :9091"
  if curl -sf http://127.0.0.1:9091/metrics 2>/dev/null | grep -q 'loganalyzer_threat_last_applied'; then
    ok "threat feed prometheus metrikleri"
  else
    warn "threat metrik yok — sudo make install && restart"
  fi
else
  bad "metrics :9091 erisilemiyor (sudo bash scripts/repair_no_xdp_stack.sh)"
fi

# --- IPC (--status) ---
if command -v log-guardian >/dev/null 2>&1; then
  ipc=$(log-guardian --status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('ipc','?'))" 2>/dev/null || echo fail)
  [[ "$ipc" == "ok" ]] && ok "IPC (--status)" || bad "IPC fail — make && sudo make install && restart"
fi

# --- Grafana/Prometheus (opsiyonel) ---
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg; then
  if bash "$ROOT/scripts/prometheus_smoke.sh" >/dev/null 2>&1; then
    ok "Prometheus scrape (docker)"
  else
    warn "Prometheus scrape — bash scripts/prometheus_smoke.sh"
  fi
fi

# --- API güvenlik ---
CONF=$(lg_rules_conf_path)
if [[ -f "$CONF" ]] || sudo test -f "$CONF" 2>/dev/null; then
  bind=$(lg_rules_kv "API_BIND")
  bind="${bind:-?}"
  [[ "$bind" == "127.0.0.1" ]] && ok "API_BIND=127.0.0.1" || bad "API_BIND=$bind"
  tok=$(lg_rules_kv "API_TOKEN")
  [[ -n "$tok" ]] && ok "API_TOKEN ayarli" || bad "API_TOKEN yok — sudo bash $SCRIPTS/ensure_api_security.sh"
else
  bad "$CONF yok"
fi

api_ok=0
if api_fail_closed_ok; then
  ok "API fail-closed (tokensiz 403)"
  api_ok=1
else
  for _ in $(seq 1 5); do
    sleep 1
    if api_fail_closed_ok; then
      ok "API fail-closed (tokensiz 403)"
      api_ok=1
      break
    fi
  done
fi
if [[ "$api_ok" -eq 0 ]]; then
  api_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    http://127.0.0.1:8090/api/v1/metrics 2>/dev/null || echo 000)
  bad "API tokensiz code=$api_code (beklenen 403 — repair_no_xdp_stack)"
fi

if bash "$SCRIPTS/api_fail_closed_test.sh" >/dev/null 2>&1; then
  ok "api_fail_closed_test"
else
  warn "api_fail_closed_test — bash $SCRIPTS/api_fail_closed_test.sh"
fi

# --- nginx hibrit (log + inline consult) ---
if command -v nginx >/dev/null 2>&1; then
  if bash "$SCRIPTS/check_nginx_log_format.sh" >/dev/null 2>&1; then
    ok "nginx log_guardian format"
  else
    warn "log_guardian format — sudo bash $SCRIPTS/fix_nginx_log_format.sh"
  fi
  if bash "$SCRIPTS/check_nginx_inline_consult.sh" >/dev/null 2>&1; then
    ok "nginx inline consult snippet"
  else
    warn "inline consult eksik — sudo bash $SCRIPTS/fix_nginx_inline_consult.sh"
  fi
fi

# --- FP trust store ---
CONF=$(lg_rules_conf_path)
FP_REL="data/fp-trust.lst"
fp_store=$(lg_rules_kv "FP_TRUST_STORE")
[[ -n "$fp_store" ]] && FP_REL="$fp_store"
FP_BASE=$(dirname "$CONF")
if [[ "$FP_REL" == /* ]]; then FP_STORE="$FP_REL"; else FP_STORE="$FP_BASE/$FP_REL"; fi
fp_ok=0
if [[ -r "$FP_STORE" && -s "$FP_STORE" ]]; then
  fp_ok=1
elif sudo test -s "$FP_STORE" 2>/dev/null; then
  fp_ok=1
elif getent group log-guardian >/dev/null 2>&1 && id -nG | tr ' ' '\n' | grep -qx log-guardian; then
  sg log-guardian -c "test -s '$FP_STORE'" 2>/dev/null && fp_ok=1
fi
if [[ "$fp_ok" -eq 1 ]]; then
  ok "FP trust store ($FP_STORE)"
else
  warn "FP trust store dogrulanamadi — bash scripts/laptop_fp_setup.sh"
fi

# --- Soak hazirligi ---
if bash "$SCRIPTS/soak_active_lock.sh" running 2>/dev/null; then
  warn "soak calisiyor — upgrade/restart yapmayin"
else
  ok "soak kilidi yok"
fi

lg_group_user="${SUDO_USER:-${USER:-}}"
[[ -z "$lg_group_user" || "$lg_group_user" == root ]] && lg_group_user="${LOG_GUARDIAN_OPERATOR:-}"
if [[ -n "$lg_group_user" ]] \
    && id -nG "$lg_group_user" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
  ok "kullanici log-guardian grubunda ($lg_group_user)"
else
  warn "log-guardian grubu yok — arka plan soak icin: sudo usermod -aG log-guardian \$USER"
fi

# --- Internet-facing ---
if bash "$SCRIPTS/detect_internet_facing.sh" 2>/dev/null; then
  echo ""
  echo "[INFO] Internet-facing makine tespit edildi"
  kdf=$(lg_rules_kv "ACCESS_PASSWORD_KDF")
  if [[ "$kdf" == "pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$"* ]]; then
    bad "demo parolasi — sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh"
  else
    ok "ACCESS_PASSWORD_KDF ozel (internet-facing)"
  fi
  if [[ -f "$REPO/dashboard/.env" ]] && grep -qE '^JWT_SECRET=' "$REPO/dashboard/.env" 2>/dev/null; then
    ok "dashboard JWT_SECRET"
  else
    warn "dashboard JWT — bash scripts/laptop_jwt_setup.sh"
  fi
  if grep -qE '^WASM_PROD_STRICT=1' "$CONF" 2>/dev/null \
      || grep -q 'WASM_PROD_STRICT' /etc/log-guardian/env 2>/dev/null; then
    ok "WASM_PROD_STRICT (internet-facing)"
  else
    warn "WASM_PROD_STRICT yok — rules.conf veya env (unsigned wasm riski)"
  fi
fi

# --- Opsiyonel audit ---
if bash "$SCRIPTS/local_security_audit.sh" >/dev/null 2>&1; then
  ok "local_security_audit"
else
  warn "local_security_audit uyari — bash $SCRIPTS/local_security_audit.sh"
fi

if bash "$SCRIPTS/check_proxy_trust.sh" >/dev/null 2>&1; then
  ok "check_proxy_trust (TRUST_XFF)"
else
  warn "check_proxy_trust — TRUST_XFF=1 ama TRUST_PROXY_CIDRS yok"
fi

if bash "$SCRIPTS/relay_lan_exposure_check.sh" >/dev/null 2>&1; then
  ok "relay_lan_exposure_check"
else
  warn "relay_lan_exposure_check — relay host'ta acik olabilir"
fi

echo ""
echo "=== ozet ==="
echo "  FAIL: $fail   WARN: $warn"
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] post_install_verify — kurulum kapisi gecti"
  if [[ "$warn" -gt 0 ]]; then
    echo "  WARN ($warn) = opsiyonel — laptop'ta normal (daemon, JWT, FP store...)"
    echo "  Profiller: docs/SECURITY_PROFILES.md"
  fi
  exit 0
fi

echo "[FAIL] post_install_verify — $fail kritik madde" >&2
for line in "${fail_lines[@]}"; do
  echo "  • $line" >&2
done
echo "" >&2
echo "  Hizli onarim (cogu FAIL):" >&2
echo "    sudo bash scripts/repair_no_xdp_stack.sh" >&2
echo "    sudo bash scripts/fix_ipc_perms.sh && newgrp log-guardian" >&2
echo "  Internet-facing demo parola:" >&2
echo "    sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh" >&2
exit 1
