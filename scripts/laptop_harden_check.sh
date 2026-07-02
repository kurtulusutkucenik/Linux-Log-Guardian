#!/usr/bin/env bash
# laptop_harden sonrasi hizli denetim (root gerekmez)
set -euo pipefail
SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPTS/.." && pwd)"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$SCRIPTS/lib/rules_conf_read.sh"
CONF=$(lg_rules_conf_path)
fail=0

check() {
  local label="$1" rc="$2"
  if [[ "$rc" -eq 0 ]]; then
    echo "[OK] $label"
  else
    echo "[FAIL] $label" >&2
    fail=$((fail + 1))
  fi
}

echo "=== laptop_harden_check ==="

# Varsayilan repo parolasi — laptop profilinde OK
kdf=$(lg_rules_kv "ACCESS_PASSWORD_KDF")
if [[ "$kdf" == "pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$"* ]]; then
  if bash "$SCRIPTS/detect_internet_facing.sh" 2>/dev/null; then
    check "ACCESS_PASSWORD_KDF ozel (repo varsayilan degil)" 1
  else
    echo "[OK] ACCESS_PASSWORD_KDF demo (laptop profil)"
  fi
else
  check "ACCESS_PASSWORD_KDF ozel" 0
fi

bind=$(lg_rules_kv "API_BIND")
bind="${bind:-?}"
[[ "$bind" == "127.0.0.1" ]] && check "API_BIND=127.0.0.1" 0 || check "API_BIND=127.0.0.1 (simdiki: $bind)" 1

api_tok=$(lg_rules_kv "API_TOKEN")
[[ -n "$api_tok" ]] && check "API_TOKEN ayarli" 0 || check "API_TOKEN ayarli (ensure_api_security)" 1

api_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
  http://127.0.0.1:8090/api/v1/metrics 2>/dev/null || echo 000)
if [[ "$api_code" == "403" || "$api_code" == "200" ]]; then
  check "API localhost yanit (fail-closed=$([[ "$api_code" == "403" ]] && echo 1 || echo 0))" 0
else
  check "API localhost yanit (code=$api_code)" 1
fi

if [[ -n "$api_tok" ]]; then
  ban_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    -X POST "http://127.0.0.1:8090/api/v1/ban?ip=203.0.113.254&reason=harden-check" 2>/dev/null || echo 000)
  if [[ "$ban_code" == "403" ]]; then
    check "ban API tokensiz 403" 0
  else
    check "ban API tokensiz 403 (code=$ban_code — sudo bash scripts/upgrade_log_guardian_binary.sh)" 1
  fi
fi

# shellcheck source=scripts/firewall_api_bind.sh
source "$ROOT/scripts/firewall_api_bind.sh" 2>/dev/null || true

# Dis arayuzden 8090 (LAN IP varsa)
lan_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
lan_api_open=0
if [[ -n "$lan_ip" ]] && [[ "$lan_ip" != "127.0.0.1" ]]; then
  if curl -sf --max-time 2 "http://${lan_ip}:8090/api/v1/metrics" >/dev/null 2>&1; then
    lan_api_open=1
    check "API LAN'dan erisilemez ($lan_ip)" 1
  else
    check "API LAN'dan erisilemez ($lan_ip)" 0
  fi
fi

if declare -F lg_firewall_api_bind_check >/dev/null 2>&1; then
  if lg_firewall_api_bind_check 2>/dev/null; then
    m=$(lg_firewall_api_bind_method 2>/dev/null || echo "?")
    check "8090 firewall kurali ($m)" 0
  elif [[ "$lan_api_open" -eq 1 ]]; then
    check "8090 firewall kurali (sudo bash scripts/firewall_api_bind.sh install)" 1
  else
    echo "[WARN] 8090 firewall kurali yok — API_BIND koruyor; sudo bash scripts/firewall_api_bind.sh install" >&2
  fi
fi

[[ -f /etc/log-guardian/webhook.env ]] || true
if [[ -f /etc/log-guardian/webhook.env ]]; then
  perms=$(stat -c '%a' /etc/log-guardian/webhook.env 2>/dev/null || echo "?")
  [[ "$perms" == "600" ]] && check "webhook.env 600" 0 || check "webhook.env 600 (simdiki: $perms)" 1
fi

# Telegram webhook modu aciksa secret zorunlu
wh_url=""
wh_sec=""
if [[ -f /etc/log-guardian/webhook.env ]]; then
  wh_url=$(grep -E '^WEBHOOK_TELEGRAM_WEBHOOK_URL=.+' /etc/log-guardian/webhook.env 2>/dev/null | tail -1 | cut -d= -f2- || true)
  wh_sec=$(grep -E '^WEBHOOK_TELEGRAM_WEBHOOK_SECRET=.+' /etc/log-guardian/webhook.env 2>/dev/null | tail -1 | cut -d= -f2- || true)
fi
[[ -z "$wh_url" ]] && wh_url=$(lg_rules_kv "WEBHOOK_TELEGRAM_WEBHOOK_URL")
[[ -z "$wh_sec" ]] && wh_sec=$(lg_rules_kv "WEBHOOK_TELEGRAM_WEBHOOK_SECRET")
if [[ -n "$wh_url" ]]; then
  [[ -n "$wh_sec" ]] && check "WEBHOOK_TELEGRAM_WEBHOOK_SECRET ayarli" 0 \
    || check "WEBHOOK_TELEGRAM_WEBHOOK_SECRET ayarli (webhook URL acik)" 1
fi

# Dashboard JWT (Docker)
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  if docker inspect log-guardian-dashboard 2>/dev/null | grep -qE 'JWT_SECRET=[a-f0-9]{32,}'; then
    check "Dashboard JWT_SECRET guclu" 0
  else
    check "Dashboard JWT_SECRET guclu (openssl rand -hex 32)" 1
  fi
fi

if [[ "$fail" -eq 0 ]]; then
  if command -v docker >/dev/null 2>&1; then
    bash "$ROOT/scripts/laptop_observability_check.sh" 2>/dev/null \
      || echo "[WARN] observability — bash scripts/dashboard_stack.sh" >&2
  fi
  echo "[OK] laptop_harden_check — tum kontroller gecti"
else
  echo "[WARN] $fail kontrol basarisiz — sudo bash scripts/ensure_api_security.sh (API) veya laptop_harden.sh (tam)" >&2
  exit 1
fi
