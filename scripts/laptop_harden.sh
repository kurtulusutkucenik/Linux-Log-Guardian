#!/usr/bin/env bash
# Laptop / ev ortami sertlestirme — VPS gerekmez (root)
#   sudo bash scripts/laptop_harden.sh
#   sudo env LG_NEW_PASSWORD='GucluParola!' bash scripts/laptop_harden.sh
#   sudo bash scripts/laptop_harden.sh --password 'GucluParola!'
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
ENV_FILE="/etc/log-guardian/env"
WEBHOOK_ENV="/etc/log-guardian/webhook.env"

[[ "$(id -u)" -eq 0 ]] || { echo "[laptop_harden] sudo gerekli" >&2; exit 1; }
[[ -f "$CONF" ]] || { echo "[laptop_harden] $CONF yok — once: sudo bash install.sh" >&2; exit 1; }

ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

ensure_kv() {
  local key="$1" val="$2" file="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

CLI_PW=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --password)
      CLI_PW="${2:-}"
      [[ -n "$CLI_PW" ]] || { echo "[laptop_harden] --password degeri bos" >&2; exit 1; }
      shift 2
      ;;
    -h|--help)
      echo "Kullanim: sudo bash scripts/laptop_harden.sh [--password 'Parola']"
      echo "  veya: sudo env LG_NEW_PASSWORD='Parola' bash scripts/laptop_harden.sh"
      echo "Not: LG_NEW_PASSWORD='x' sudo bash ... CALISMAZ (sudo env degiskeni sifirlar)"
      exit 0
      ;;
    *) shift ;;
  esac
done

echo "=== laptop_harden ==="

# 1) Varsayilan parola (repo'daki DegistirBeni!123 herkese acik)
NEW_PW="${CLI_PW:-${LG_NEW_PASSWORD:-}}"
if [[ -z "$NEW_PW" ]]; then
  NEW_PW="$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)"
  echo "[laptop_harden] parola verilmedi — rastgele uretildi (--password veya sudo env LG_NEW_PASSWORD=...)"
fi
KDF=$(python3 -c "
import hashlib, os, sys
pw = sys.argv[1].encode()
s = os.urandom(16)
print('pbkdf2\$100000\$' + s.hex() + '\$' + hashlib.pbkdf2_hmac('sha256', pw, s, 100000).hex())
" "$NEW_PW")
sed -i '/^ACCESS_PASSWORD_KDF=/d' "$CONF"
sed -i '/^ACCESS_PASSWORD_HASH=/d' "$CONF"
printf '\nACCESS_PASSWORD_KDF=%s\n' "$KDF" >> "$CONF"
if [[ -x "$ROOT/scripts/fix_rules_conf_perms.sh" ]]; then
  bash "$ROOT/scripts/fix_rules_conf_perms.sh"
else
  chmod 640 "$CONF"
  chown root:log-guardian "$CONF" 2>/dev/null || true
fi
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^LOGANALYZER_PASSWORD=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^LOGANALYZER_PASSWORD=.*|LOGANALYZER_PASSWORD=${NEW_PW}|" "$ENV_FILE"
  else
    echo "LOGANALYZER_PASSWORD=${NEW_PW}" >> "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE"
fi
ok "ACCESS_PASSWORD_KDF yenilendi — parolayi kaydedin (ekrana yazilmiyor)"

# 2) API :8090 — localhost + token (POST ban/unban)
ensure_kv "API_BIND" "127.0.0.1" "$CONF"
if ! grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null; then
  API_TOK="$(openssl rand -hex 32)"
  echo "API_TOKEN=${API_TOK}" >> "$CONF"
  ok "API_TOKEN uretildi (rules.conf — dashboard icin GUARDIAN_API_TOKEN)"
else
  ok "API_TOKEN mevcut"
fi
ok "API_BIND=127.0.0.1 (nginx localhost uzerinden consult/ban)"

# 8090 dis erisim — iptables -> nftables -> ufw (aktifse)
# shellcheck source=scripts/firewall_api_bind.sh
source "$ROOT/scripts/firewall_api_bind.sh"
if fw_method=$(lg_firewall_api_bind_install 2>/dev/null); then
  ok "${fw_method}: 8090 yalnizca localhost + docker agi"
else
  warn "8090 firewall kurali eklenemedi (iptables/nftables/ufw) — API_BIND=127.0.0.1 yedek"
  warn "  Manuel: sudo bash scripts/firewall_api_bind.sh install"
fi

# 3) webhook.env izinleri + Telegram secret
if [[ -f "$WEBHOOK_ENV" ]]; then
  chmod 600 "$WEBHOOK_ENV"
  chown root:root "$WEBHOOK_ENV" 2>/dev/null || true
  ok "webhook.env chmod 600"
  if ! grep -qE '^WEBHOOK_TELEGRAM_WEBHOOK_SECRET=.+' "$WEBHOOK_ENV" 2>/dev/null \
     && ! grep -qE '^WEBHOOK_TELEGRAM_WEBHOOK_SECRET=.+' "$CONF" 2>/dev/null; then
    SEC="$(openssl rand -hex 24)"
    echo "WEBHOOK_TELEGRAM_WEBHOOK_SECRET=${SEC}" >> "$WEBHOOK_ENV"
    ok "WEBHOOK_TELEGRAM_WEBHOOK_SECRET eklendi (webhook modunda zorunlu)"
  fi
fi

# 4) rules.conf / env izinleri
if getent group log-guardian >/dev/null 2>&1; then
  chown root:log-guardian "$CONF"
  chmod 640 "$CONF"
  chown root:log-guardian /etc/log-guardian 2>/dev/null || true
  chmod 750 /etc/log-guardian 2>/dev/null || true
  ok "rules.conf izinleri root:log-guardian 640"
fi

# 5) Dashboard JWT uyarisi
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  if [[ -z "${JWT_SECRET:-}" ]] && ! docker inspect log-guardian-dashboard 2>/dev/null \
      | grep -qE 'JWT_SECRET=[a-f0-9]{32,}'; then
    warn "Dashboard JWT_SECRET zayif/eksik — docker compose yeniden JWT_SECRET ile baslatin"
  else
    ok "Dashboard container calisiyor"
  fi
fi

# 5b) systemd --password-file KDF ile hizala (harden sonrasi servis crash onleme)
if [[ -x "$ROOT/scripts/sync_service_password.sh" ]]; then
  bash "$ROOT/scripts/sync_service_password.sh" || warn "sync_service_password — journalctl -u log-guardian"
fi

# 6) Binary + servis (cp Text file busy onleme)
systemctl reset-failed log-guardian log-guardian-daemon 2>/dev/null || true
systemctl restart log-guardian-daemon
sleep 2
if [[ -x "$ROOT/log-guardian" ]]; then
  bash "$ROOT/scripts/upgrade_log_guardian_binary.sh" || warn "binary upgrade atlandi — make && sudo bash scripts/upgrade_log_guardian_binary.sh"
else
  systemctl restart log-guardian
  sleep 2
  warn "repo log-guardian yok — once: make -j\$(nproc) && sudo bash scripts/upgrade_log_guardian_binary.sh"
fi

if curl -sf --max-time 3 http://127.0.0.1:8090/api/v1/metrics >/dev/null; then
  ok "API :8090 localhost OK"
  api_tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$api_tok" ]]; then
    ban_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      -X POST "http://127.0.0.1:8090/api/v1/ban?ip=203.0.113.254" 2>/dev/null || echo 000)
    [[ "$ban_code" == "403" ]] && ok "ban API tokensiz 403" \
      || warn "ban API tokensiz code=${ban_code} — eski binary? sudo bash scripts/upgrade_log_guardian_binary.sh"
  fi
else
  warn "API henuz hazir degil — journalctl -u log-guardian -n 15"
fi

API_TOK_PRINT=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

echo ""
echo "=== laptop_harden tamam ==="
echo "  Yeni parola: LG_NEW_PASSWORD ile verdiyseniz o; yoksa uretilen parolayi"
echo "  /etc/log-guardian/env icinde LOGANALYZER_PASSWORD satirindan alin."
echo "  Test: LOGANALYZER_PASSWORD='...' sudo -E log-guardian --status --quiet | head"
echo "  Kontrol: bash scripts/laptop_harden_check.sh"
if [[ -n "$API_TOK_PRINT" ]] && docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  echo "  Dashboard ban API token:"
  echo "    export GUARDIAN_API_TOKEN='${API_TOK_PRINT}'"
  echo "    docker compose -f docker-compose.prod.yml up -d dashboard"
fi
