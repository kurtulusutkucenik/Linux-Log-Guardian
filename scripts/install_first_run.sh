#!/usr/bin/env bash
# Ilk kurulum sonrasi — surtunmesiz baslangic (demo parola kalabilir)
#   sudo bash scripts/install_first_run.sh
# Internet-facing:
#   sudo env LG_NEW_PASSWORD='GucluParola' bash scripts/install_first_run.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ "$(id -u)" -eq 0 ]] || { echo "[install_first_run] sudo gerekli" >&2; exit 1; }

echo "=== install_first_run ==="
echo "  Ucretsiz Log Guardian — ilk calistirma"
echo ""

# Soak kilidi
if bash "$ROOT/scripts/soak_active_lock.sh" running 2>/dev/null; then
  echo "[install_first_run] FAIL: soak calisiyor — once bitirin veya UPGRADE_FORCE=1" >&2
  exit 1
fi

bash "$ROOT/scripts/ensure_api_security.sh"

if [[ -x "$ROOT/scripts/sync_service_password.sh" ]]; then
  bash "$ROOT/scripts/sync_service_password.sh" || true
fi

# IPC + soak icin grup izinleri
bash "$ROOT/scripts/fix_ipc_perms.sh"

# API firewall (LAN DROP)
# shellcheck source=scripts/firewall_api_bind.sh
source "$ROOT/scripts/firewall_api_bind.sh" 2>/dev/null || true
if declare -F lg_firewall_api_bind_install >/dev/null 2>&1; then
  if fw_method=$(lg_firewall_api_bind_install 2>/dev/null); then
    echo "[OK] firewall API ($fw_method)"
  else
    echo "[WARN] firewall API kurulamadi — sudo bash scripts/firewall_api_bind.sh install" >&2
  fi
fi

# Parola sertlestirme: LG_NEW_PASSWORD verildiyse laptop'ta da uygula
if [[ -n "${LG_NEW_PASSWORD:-}" ]]; then
  echo ""
  echo "[install_first_run] LG_NEW_PASSWORD — laptop_harden"
  LG_NEW_PASSWORD="$LG_NEW_PASSWORD" bash "$ROOT/scripts/laptop_harden.sh"
elif bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  INTERNET-FACING — demo parola kabul edilmez               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo "[install_first_run] LG_NEW_PASSWORD zorunlu" >&2
  echo "  sudo env LG_NEW_PASSWORD='GucluParola' bash scripts/install_first_run.sh" >&2
  echo "  Profil: docs/SECURITY_PROFILES.md" >&2
  exit 1
else
  echo "[INFO] Yerel/laptop profil — demo parola kalabilir (degistirmek icin LG_NEW_PASSWORD=...)"
  echo "[INFO] Profiller: docs/SECURITY_PROFILES.md"
fi

if command -v nginx >/dev/null 2>&1; then
  bash "$ROOT/scripts/enforce_nginx_log_format.sh" 2>/dev/null \
    || bash "$ROOT/scripts/fix_nginx_log_format.sh" 2>/dev/null || true
  bash "$ROOT/scripts/enforce_nginx_inline_consult.sh" 2>/dev/null \
    || bash "$ROOT/scripts/fix_nginx_inline_consult.sh" 2>/dev/null || true
else
  echo "[INFO] nginx yok — log format / inline consult atlandi"
fi

if [[ "${SKIP_FP_WARMUP:-0}" != "1" ]]; then
  echo ""
  echo "[install_first_run] FP isinma (corpus, ~10 sn)..."
  TR="${ROOT}/test_rules.conf"
  [[ -f "$TR" ]] || TR="test_rules.conf"
  FP_STORE="/var/lib/log-guardian/fp-trust-warmup.lst"
  if [[ -f "$ROOT/main.c" && "${SKIP_BINARY_UPGRADE:-0}" != "1" ]] \
      && [[ -x "$ROOT/scripts/upgrade_log_guardian_binary.sh" ]]; then
    if ! strings /usr/local/bin/log-guardian 2>/dev/null | grep -qF LOG_GUARDIAN_SKIP_IPC; then
      echo "[install_first_run] eski /usr/local/bin/log-guardian — binary guncelleniyor..."
      bash "$ROOT/scripts/upgrade_log_guardian_binary.sh" || \
        echo "[WARN] binary upgrade atlandi — FP repo binary ile devam" >&2
    fi
  fi
  if [[ -f "$ROOT/main.c" ]]; then
    make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian 2>/dev/null || true
  fi
  systemctl stop log-guardian 2>/dev/null || true
  FP_LG_BIN="${LG_BIN:-$ROOT/log-guardian}"
  [[ -x "$FP_LG_BIN" ]] || FP_LG_BIN="/usr/local/bin/log-guardian"
  if env LOGANALYZER_PASSWORD='DegistirBeni!123' FP_RULES="$TR" FP_TRUST_STORE="$FP_STORE" \
      FP_WARMUP_PASSES=1 FP_WARMUP_MIN_SAMPLES=3 FP_WARMUP_TIMEOUT_SEC=120 \
      LG_BIN="$FP_LG_BIN" bash "$ROOT/scripts/fp_learn_warmup.sh"; then
    bash "$ROOT/scripts/install_fp_trust_prod.sh" "$FP_STORE"
  else
    echo "[WARN] FP warmup atlandi — sonra: bash scripts/fp_learn_warmup.sh" >&2
    echo "  binary: sudo bash scripts/upgrade_log_guardian_binary.sh" >&2
    echo "  veya: sudo env SKIP_FP_WARMUP=1 bash scripts/install_first_run.sh" >&2
  fi
fi

if [[ "${OPENAPI_STRICT_AUTO:-0}" == "1" ]]; then
  echo ""
  echo "[install_first_run] OpenAPI strict (API host)..."
  bash "$ROOT/scripts/install_openapi_strict_prod.sh" 2>/dev/null || \
    echo "[WARN] OpenAPI strict atlandi" >&2
fi

if command -v nginx >/dev/null 2>&1; then
  echo ""
  echo "[install_first_run] nginx inline consult..."
  bash "$ROOT/scripts/fix_nginx_inline_consult.sh" 2>/dev/null || \
    echo "[WARN] inline consult atlandi" >&2
fi

if bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  if ! grep -qE '^OPENAPI_STRICT=1' "${LG_RULES:-/etc/log-guardian/rules.conf}" 2>/dev/null; then
    echo "[INFO] Internet-facing — API host icin: sudo bash scripts/install_openapi_strict_prod.sh"
  fi
fi

bash "$ROOT/scripts/install_fp_report_cron.sh" 2>/dev/null || true
bash "$ROOT/scripts/install_audit_cron.sh" 2>/dev/null || true

# VM zip / laptop soak: etcd+SAAS journal gurultusu (dashboard yok)
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
if [[ ! -d "$ROOT/dashboard" ]] || [[ "${LG_QUIET_FLEET:-0}" == "1" ]]; then
  if [[ -f "$RULES" ]]; then
    for kv in "MESH_BACKEND=none" "MESH_ETCD_ENDPOINTS=" "SAAS_ENABLED=0"; do
      k="${kv%%=*}"
      v="${kv#*=}"
      if grep -q "^${k}=" "$RULES" 2>/dev/null; then
        sed -i "s|^${k}=.*|${k}=${v}|" "$RULES"
      else
        echo "${k}=${v}" >> "$RULES"
      fi
    done
    echo "[OK] fleet mesh kapali (VM/laptop profil — dashboard yok)"
  fi
fi

systemctl restart log-guardian-daemon 2>/dev/null || true
systemctl restart log-guardian 2>/dev/null || true
sleep 2

# Dashboard JWT (sudo altinda gercek kullanici)
RUN_USER="${SUDO_USER:-${INSTALL_USER:-}}"
LG_REPO_HINT="${LG_REPO:-$HOME/Masaüstü/Linux Log Guardian}"
if [[ -n "$RUN_USER" && "$RUN_USER" != "root" ]]; then
  if sudo -u "$RUN_USER" env LG_REPO="$LG_REPO_HINT" bash "$ROOT/scripts/laptop_jwt_setup.sh" 2>/dev/null; then
    echo "[OK] dashboard JWT ($RUN_USER)"
  else
    echo "[WARN] laptop_jwt_setup atlandi — bash scripts/laptop_jwt_setup.sh" >&2
  fi
else
  echo "[INFO] JWT: bash scripts/laptop_jwt_setup.sh (normal kullanici ile)"
fi

if [[ -n "$RUN_USER" && "$RUN_USER" != "root" ]]; then
  if ! id -nG "$RUN_USER" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    usermod -aG log-guardian "$RUN_USER" 2>/dev/null || true
    echo "[OK] $RUN_USER → log-guardian grubu (yeni shell gerekir)"
  fi
fi

echo ""
echo "=== Kurulum ozeti ==="
HEALTH_BIN="/usr/local/bin/log-guardian"
if "$HEALTH_BIN" --health --db /etc/log-guardian/events.db >/dev/null 2>&1; then
  echo "  health:     OK"
else
  echo "  health:     sg log-guardian veya yeni shell sonra tekrar deneyin"
fi
API_TOK=$(grep -E '^API_TOKEN=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2- || true)
if [[ -n "$API_TOK" ]]; then
  echo "  API token:  ${API_TOK:0:12}... (rules.conf)"
else
  echo "  API token:  YOK — sudo bash scripts/ensure_api_security.sh"
fi
echo "  dashboard:  bash scripts/dashboard_stack.sh → https://localhost:8443"
echo "  dogrulama:  bash scripts/post_install_verify.sh"
echo ""
echo "=== Ilk 5 dk demo ==="
echo "  bash scripts/demo_3min.sh"
echo ""
echo "[OK] install_first_run tamam — docs/QUICKSTART_15MIN.md"
