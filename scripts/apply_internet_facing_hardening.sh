#!/usr/bin/env bash
# Internet-facing prod sertlestirme — ban/WAF hattina dokunmaz (nginx reload, env patch, firewall)
#   sudo bash scripts/apply_internet_facing_hardening.sh
# Laptop: atlanir (detect_internet_facing). Zorla test: LG_FORCE_INTERNET_FACING=1
#   SKIP_NGINX=1 SKIP_DASHBOARD_FW=1 SKIP_WASM=1 SKIP_FP_CHECK=1
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  echo "[SKIP] apply_internet_facing_hardening — laptop/yerel profil"
  exit 0
fi

[[ "$(id -u)" -eq 0 ]] || {
  echo "[apply_internet_facing_hardening] sudo gerekli" >&2
  exit 1
}

CONF_DIR="${LG_CONF:-/etc/log-guardian}"
ENV_FILE="$CONF_DIR/env"
RULES="${LG_RULES:-$CONF_DIR/rules.conf}"
need_restart=0

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

set_env_kv() {
  local key="$1" val="$2"
  install -d -m 750 "$CONF_DIR"
  touch "$ENV_FILE"
  chmod 640 "$ENV_FILE" 2>/dev/null || true
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >>"$ENV_FILE"
  fi
}

echo "=== apply_internet_facing_hardening ==="

# Geri alma — env/rules yedek (HARDENING_ROLLBACK.md)
_ts=$(date +%Y%m%d%H%M)
if [[ -f "$ENV_FILE" ]]; then
  cp -a "$ENV_FILE" "$ENV_FILE.bak.$_ts"
  ok "env yedek -> $ENV_FILE.bak.$_ts"
fi
if [[ -f "$RULES" ]]; then
  cp -a "$RULES" "$RULES.bak.$_ts"
  ok "rules yedek -> $RULES.bak.$_ts"
fi
bash "$ROOT/scripts/backup_operator_secrets.sh" 2>/dev/null || warn "backup_operator_secrets atlandi"

# --- WASM imzali paket (prod env; laptop'ta calismaz) ---
if [[ "${SKIP_WASM:-0}" != "1" ]]; then
  if grep -qE '^WASM_PROD_STRICT=1' "$ENV_FILE" 2>/dev/null; then
    ok "WASM_PROD_STRICT zaten env'de"
  else
    set_env_kv WASM_PROD_STRICT 1
    need_restart=1
    ok "WASM_PROD_STRICT=1 -> $ENV_FILE"
  fi
fi

# --- nginx rate limit (lg_general) ---
if [[ "${SKIP_NGINX:-0}" != "1" ]] && command -v nginx >/dev/null 2>&1; then
  if bash "$ROOT/scripts/check_nginx_rate_limit.sh" >/dev/null 2>&1; then
    ok "nginx rate limit (lg_general)"
  else
    echo "[apply] nginx rate limit eksik — fix_nginx_log_format..."
    if bash "$ROOT/scripts/fix_nginx_log_format.sh"; then
      ok "nginx rate limit kuruldu"
    else
      warn "nginx rate limit — sudo bash scripts/fix_nginx_log_format.sh"
    fi
  fi
fi

# --- Dashboard :8443 LAN kapisi (yalnizca Caddy calisiyorsa) ---
if [[ "${SKIP_DASHBOARD_FW:-0}" != "1" ]]; then
  if command -v docker >/dev/null 2>&1 \
      && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
    if bash "$ROOT/scripts/check_dashboard_tls_bind.sh" >/dev/null 2>&1; then
      ok "dashboard :8443 LAN kapali"
    else
      # shellcheck source=scripts/firewall_dashboard_bind.sh
      source "$ROOT/scripts/firewall_dashboard_bind.sh" 2>/dev/null || true
      if declare -F lg_firewall_dashboard_bind_install >/dev/null 2>&1; then
        if m=$(lg_firewall_dashboard_bind_install 2>/dev/null); then
          ok "firewall_dashboard_bind ($m)"
        else
          warn "firewall_dashboard_bind — sudo bash scripts/firewall_dashboard_bind.sh install"
        fi
      else
        warn "firewall_dashboard_bind script yuklenemedi"
      fi
    fi
  else
    echo "[INFO] dashboard Caddy yok — firewall_dashboard_bind atlandi"
  fi
fi

# --- FP trust store (yalnizca dogrulama; warmup install_first_run'da) ---
if [[ "${SKIP_FP_CHECK:-0}" != "1" ]] && [[ -f "$RULES" ]]; then
  # shellcheck source=scripts/lib/rules_conf_read.sh
  source "$ROOT/scripts/lib/rules_conf_read.sh"
  fp_rel=$(lg_rules_kv "FP_TRUST_STORE")
  [[ -n "$fp_rel" ]] || fp_rel="data/fp-trust.lst"
  if [[ "$fp_rel" == /* ]]; then
    fp_store="$fp_rel"
  else
    fp_store="$(dirname "$RULES")/$fp_rel"
  fi
  if [[ -s "$fp_store" ]]; then
    ok "FP trust store ($fp_store)"
  else
    warn "FP trust store bos — sudo bash scripts/install_first_run.sh (veya laptop_fp_setup.sh)"
  fi
fi

# --- API read/mutate token split (internet-facing; ban hattina dokunmaz) ---
if [[ "${SKIP_API_SPLIT:-0}" != "1" ]]; then
  if bash "$ROOT/scripts/ensure_api_split_tokens.sh"; then
    ok "API split tokens (read/mutate)"
  else
    warn "API split tokens — sudo bash scripts/ensure_api_split_tokens.sh"
  fi
fi

if [[ "$need_restart" -eq 1 ]]; then
  systemctl restart log-guardian 2>/dev/null || true
  sleep 2
  ok "log-guardian restart (WASM_PROD_STRICT)"
fi

echo ""
echo "[OK] apply_internet_facing_hardening tamam"
if [[ "${LG_FORCE_INTERNET_FACING:-0}" == "1" ]]; then
  echo "  [SIM] LG_FORCE dry-run — laptop'ta kalici VPS sertlestirmesi uygulandi"
  echo "  Dogrula: LG_FORCE_INTERNET_FACING=1 bash scripts/post_install_verify.sh"
else
  echo "  Dogrula: bash scripts/post_install_verify.sh"
fi
echo "  Tam strict: POST_INSTALL_STRICT=1 bash scripts/post_install_verify.sh"
