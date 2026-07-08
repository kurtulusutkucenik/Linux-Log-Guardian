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

# Grup uyeligi var ama shell'de aktif degilse (VM'de sik) — vm_demo_gate ile ayni
if [[ $EUID -ne 0 && -z "${LG_VERIFY_IN_SG:-}" ]] \
    && getent group log-guardian >/dev/null 2>&1 \
    && id -nG 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
  export LG_VERIFY_IN_SG=1
  exec sg log-guardian -c "bash \"$ROOT/scripts/post_install_verify.sh\""
fi

INTERNET_FACING=0
INTERNET_FACING_SIM=0
_real_internet=0
if LG_FORCE_INTERNET_FACING=0 bash "$SCRIPTS/detect_internet_facing.sh" 2>/dev/null; then
  _real_internet=1
fi
if bash "$SCRIPTS/detect_internet_facing.sh" 2>/dev/null; then
  INTERNET_FACING=1
fi
if [[ "$INTERNET_FACING" -eq 1 && "$_real_internet" -eq 0 ]]; then
  INTERNET_FACING_SIM=1
fi

# Internet-facing veya POST_INSTALL_STRICT=1 → WARN yerine FAIL
strict_or_warn() {
  local msg="$1"
  if [[ "$INTERNET_FACING" -eq 1 || "${POST_INSTALL_STRICT:-0}" == "1" ]]; then
    bad "$msg"
  else
    warn "$msg"
  fi
}

harden_cmd() {
  if [[ "$INTERNET_FACING_SIM" -eq 1 ]]; then
    echo "LG_FORCE_INTERNET_FACING=1 sudo bash scripts/apply_internet_facing_hardening.sh"
  else
    echo "sudo bash scripts/apply_internet_facing_hardening.sh"
  fi
}

echo "=== post_install_verify ==="
if [[ "$INTERNET_FACING_SIM" -eq 1 ]]; then
  echo "[SIM] LG_FORCE_INTERNET_FACING=1 — VPS dry-run (laptop gercekte saglikli; asagidaki FAIL beklenen kontrol listesi)"
  echo "      Gercek laptop testi: bash scripts/post_install_verify.sh"
fi
echo ""

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
  ok "log-guardian-daemon inactive (laptop OK — eBPF opsiyonel)"
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

# --- Grafana/Prometheus (opsiyonel — stack kapaliysa atlanir) ---
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg; then
  if bash "$ROOT/scripts/prometheus_smoke.sh" >/dev/null 2>&1; then
    ok "Prometheus scrape (docker)"
  else
    warn "Prometheus scrape (opsiyonel) — bash scripts/grafana_stack.sh && bash scripts/prometheus_smoke.sh"
  fi
else
  ok "Prometheus scrape atlandi (opsiyonel — bash scripts/grafana_stack.sh)"
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
  if bash "$SCRIPTS/check_nginx_rate_limit.sh" >/dev/null 2>&1; then
    ok "nginx rate limit (lg_general)"
  else
    strict_or_warn "nginx rate limit eksik — sudo bash $SCRIPTS/fix_nginx_log_format.sh (docs/EDGE_PROTECTION.md)"
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
  strict_or_warn "FP trust store dogrulanamadi — sudo bash scripts/install_first_run.sh veya bash scripts/laptop_fp_setup.sh"
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
if [[ "$INTERNET_FACING" -eq 1 ]]; then
  echo ""
  if [[ "$INTERNET_FACING_SIM" -eq 1 ]]; then
    echo "[SIM] VPS profil kontrolleri (LG_FORCE — laptop kurulumuna dokunmaz)"
  else
    echo "[INFO] Internet-facing makine tespit edildi"
  fi
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
  # Demo dashboard parola — Community OK; internet-facing FAIL
  _dash_demo=0
  for _envf in "$REPO/dashboard/.env" "$REPO/.env" /etc/log-guardian/env; do
    [[ -f "$_envf" ]] || continue
    if grep -qE '^DASHBOARD_ADMIN_PASSWORD=(ChangeMeOnFirstLogin!|DegistirBeni!123)?$' "$_envf" 2>/dev/null \
      || grep -qE '^DASHBOARD_ADMIN_PASSWORD=ChangeMeOnFirstLogin!' "$_envf" 2>/dev/null; then
      _dash_demo=1
      break
    fi
  done
  if [[ "${DASHBOARD_ADMIN_PASSWORD:-}" == "ChangeMeOnFirstLogin!" ]] \
    || [[ "${DASHBOARD_ADMIN_PASSWORD:-}" == "DegistirBeni!123" ]]; then
    _dash_demo=1
  fi
  if [[ "$_dash_demo" -eq 1 ]]; then
    bad "dashboard demo parola — DASHBOARD_ADMIN_PASSWORD degistir (laptop_jwt_setup / .env)"
  else
    ok "dashboard admin parola (demo degil veya set)"
  fi
  if grep -qE '^WASM_PROD_STRICT=1' /etc/log-guardian/env 2>/dev/null; then
    ok "WASM_PROD_STRICT (env)"
  else
    strict_or_warn "WASM_PROD_STRICT yok — $(harden_cmd)"
  fi
  if bash "$SCRIPTS/check_dashboard_tls_bind.sh" >/dev/null 2>&1; then
    ok "dashboard TLS bind (LAN kapali)"
  else
    strict_or_warn "dashboard :8443 LAN acik — sudo bash scripts/firewall_dashboard_bind.sh install"
  fi
fi

# --- Intel ban DB (TTL + boyut; ban mantigina dokunmaz) ---
if WARN_ONLY=1 bash "$SCRIPTS/intel_ban_db_ops_check.sh" >/dev/null 2>&1; then
  ok "intel_ban_db (TTL + boyut)"
else
  warn "intel_ban_db — WARN_ONLY=1 bash scripts/intel_ban_db_ops_check.sh"
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
if [[ "$INTERNET_FACING_SIM" -eq 1 ]]; then
  echo "" >&2
  echo "  [SIM] Laptop kurulumu saglikli olabilir — FAIL yalnizca VPS kontrol listesi." >&2
  echo "        WASM dry-run: LG_FORCE_INTERNET_FACING=1 sudo bash scripts/apply_internet_facing_hardening.sh" >&2
  echo "        Normal laptop: bash scripts/post_install_verify.sh  (FAIL:0 beklenir)" >&2
fi
echo "" >&2
echo "  Hizli onarim (cogu FAIL):" >&2
echo "    sudo bash scripts/repair_no_xdp_stack.sh" >&2
echo "    sudo bash scripts/fix_ipc_perms.sh && newgrp log-guardian" >&2
echo "  Internet-facing demo parola:" >&2
echo "    sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh" >&2
exit 1
