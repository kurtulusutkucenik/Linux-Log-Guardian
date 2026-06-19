#!/usr/bin/env bash
# Yerel guvenlik denetimi — VPS/GitHub gerekmez (docs ile karistirmayin)
#   bash scripts/local_security_audit.sh
#   sudo bash scripts/local_security_audit.sh   # canli API/ban testleri icin
# Dokumantasyon tutarliligi ayri: bash scripts/docs_consistency_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_SHARE="/usr/local/share/log-guardian"
SRC_ROOT="$ROOT"
if [[ ! -f "$SRC_ROOT/ipc_auth.c" ]]; then
  for try in "${LG_REPO:-}" "$HOME/Masaüstü/Linux Log Guardian"; do
    [[ -n "$try" && -f "$try/ipc_auth.c" ]] && SRC_ROOT="$try" && break
  done
fi

SCRIPTS="$ROOT/scripts"
if [[ "$ROOT" == "$LG_SHARE" ]] && [[ -d "$LG_SHARE/scripts" ]]; then
  SCRIPTS="$LG_SHARE/scripts"
elif [[ "$ROOT" != "$LG_SHARE" && -d "$ROOT/scripts" ]]; then
  SCRIPTS="$ROOT/scripts"
elif [[ -d "$LG_SHARE/scripts" ]]; then
  SCRIPTS="$LG_SHARE/scripts"
fi
LIB="$SCRIPTS/lib/rules_conf_read.sh"
[[ -f "$LIB" ]] || LIB="$ROOT/scripts/lib/rules_conf_read.sh"
[[ -f "$LIB" ]] || LIB="$HOME/Masaüstü/Linux Log Guardian/scripts/lib/rules_conf_read.sh"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$LIB"

CONF=$(lg_rules_conf_path)
fail=0
warn=0

ok()   { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
bad()  { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== local_security_audit ==="
echo "  VPS/GitHub gerekmez — laptop prod oncesi kontrol"
echo ""

# --- Statik kod / repo ---
if [[ -f "$SRC_ROOT/ipc_auth.c" ]] && [[ -d "$SRC_ROOT/dashboard/src" ]]; then
  sh_args=()
  [[ -x "$SRC_ROOT/log-guardian" ]] && sh_args+=(LG_SKIP_BUILD=1)
  if env "${sh_args[@]}" bash "$SRC_ROOT/scripts/security_hardening_test.sh" >/dev/null 2>&1; then
    ok "security_hardening_test (IPC, JWT, install)"
  else
    bad "security_hardening_test — make log-guardian veya LG_SKIP_BUILD=1"
  fi
elif [[ -f "$SRC_ROOT/ipc_auth.c" ]]; then
  ok "security_hardening_test atlandi (VM zip — dashboard yok)"
else
  warn "security_hardening_test atlandi (kaynak repo yok — deb kurulumu)"
fi

if grep -qE '^API_BIND=0\.0\.0\.0' "$SRC_ROOT/rules.conf" 2>/dev/null; then
  bad "rules.conf sablonu API_BIND=0.0.0.0 (127.0.0.1 olmali)"
else
  ok "rules.conf sablonu API_BIND guvenli"
fi

if grep -q 'sk_guardian_fleet_test_token_123' "$SRC_ROOT/rules.conf" 2>/dev/null; then
  bad "rules.conf test fleet token"
else
  ok "rules.conf test fleet token yok"
fi

# --- Kurulu sistem (/etc) ---
if [[ -f "$CONF" ]] || sudo test -f "$CONF" 2>/dev/null; then
  bind=$(lg_rules_kv "API_BIND")
  bind="${bind:-?}"
  if [[ "$bind" == "127.0.0.1" ]]; then
    ok "prod API_BIND=127.0.0.1"
  else
    bad "prod API_BIND=$bind (127.0.0.1 olmali)"
  fi

  if [[ -n "$(lg_rules_kv "API_TOKEN")" ]]; then
    ok "prod API_TOKEN ayarli"
  else
    warn "prod API_TOKEN yok — sudo bash scripts/ensure_api_security.sh"
  fi

  kdf=$(lg_rules_kv "ACCESS_PASSWORD_KDF")
  if [[ "$kdf" == "pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$"* ]]; then
    warn "varsayilan demo parolasi (/etc) — laptop OK, internete acik sunucuda degistirin"
  else
    ok "ACCESS_PASSWORD_KDF ozel"
  fi
else
  warn "$CONF yok — install.sh sonrasi tekrar calistir"
fi

if [[ -f /etc/log-guardian/webhook.env ]]; then
  perms=$(stat -c '%a' /etc/log-guardian/webhook.env 2>/dev/null || echo "?")
  [[ "$perms" == "600" ]] && ok "webhook.env 600" || bad "webhook.env izin=$perms"
else
  warn "webhook.env yok"
fi

# --- Canli servis ---
if systemctl is-active log-guardian >/dev/null 2>&1; then
  ok "log-guardian.service active"
  api_tok=$(lg_rules_kv "API_TOKEN")
  api_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    http://127.0.0.1:8090/api/v1/metrics 2>/dev/null || echo 000)
  if [[ "$api_code" == "403" ]]; then
    ok "API read endpoints tokensiz 403 (fail-closed)"
  elif [[ "$api_code" == "200" ]]; then
    bad "API /metrics tokensiz acik — binary guncel degil (upgrade_log_guardian_binary.sh)"
  elif [[ "$api_code" == "000" ]]; then
    warn "API :8090 yanit vermiyor"
  else
    warn "API /metrics code=$api_code"
  fi
  if [[ -n "$api_tok" && "$api_code" == "403" ]]; then
    auth_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      -H "Authorization: Bearer $api_tok" \
      http://127.0.0.1:8090/api/v1/metrics 2>/dev/null || echo 000)
    [[ "$auth_code" == "200" ]] && ok "API /metrics token ile 200" \
      || bad "API /metrics token ile code=$auth_code"
    ban_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      -X POST "http://127.0.0.1:8090/api/v1/ban?ip=203.0.113.254" 2>/dev/null || echo 000)
    [[ "$ban_code" == "403" ]] && ok "ban API tokensiz reddediliyor" \
      || bad "ban API tokensiz code=$ban_code"
  fi
  if grep -q 'api_check_read_auth' "$SRC_ROOT/api_server.c" 2>/dev/null; then
    ok "api_server read auth (kaynak)"
  else
    bad "api_server read auth eksik"
  fi
  if grep -q 'ban_rate_ok' "$SRC_ROOT/api_server.c" 2>/dev/null; then
    ok "api_server ban rate limit (kaynak)"
  else
    bad "api_server ban rate limit eksik"
  fi
else
  ok "log-guardian.service atlandi (kapali — community laptop static audit OK)"
  if grep -q 'api_check_read_auth' "$SRC_ROOT/api_server.c" 2>/dev/null; then
    ok "api_server read auth (kaynak)"
  else
    bad "api_server read auth eksik"
  fi
  if grep -q 'ban_rate_ok' "$SRC_ROOT/api_server.c" 2>/dev/null; then
    ok "api_server ban rate limit (kaynak)"
  else
    bad "api_server ban rate limit eksik"
  fi
fi

lan_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -n "$lan_ip" && "$lan_ip" != "127.0.0.1" ]]; then
  if curl -sf --max-time 2 "http://${lan_ip}:8090/api/v1/metrics" >/dev/null 2>&1; then
    bad "API LAN'dan erisilebilir ($lan_ip:8090)"
  else
    ok "API LAN'dan kapali"
  fi
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  if docker inspect log-guardian-dashboard 2>/dev/null | grep -qE 'JWT_SECRET=[a-f0-9]{32,}'; then
    ok "Dashboard JWT_SECRET guclu"
  elif bash "$ROOT/scripts/detect_internet_facing.sh" >/dev/null 2>&1; then
    bad "Dashboard JWT_SECRET zayif (internet-facing — bash scripts/laptop_jwt_setup.sh)"
  else
    warn "Dashboard JWT_SECRET zayif (laptop OK — prod: bash scripts/laptop_jwt_setup.sh)"
  fi
fi

# --- laptop_harden_check (servis ayaktayken) ---
if systemctl is-active log-guardian >/dev/null 2>&1; then
  if bash "$ROOT/scripts/laptop_harden_check.sh" >/dev/null 2>&1; then
    ok "laptop_harden_check"
  else
    warn "laptop_harden_check — sudo bash scripts/ensure_api_security.sh veya laptop_harden.sh"
  fi
else
  ok "laptop_harden_check atlandi (servis kapali)"
fi

echo ""
echo "=== ozet ==="
echo "  FAIL: $fail   WARN: $warn"
if [[ "$fail" -eq 0 ]]; then
  if [[ "$warn" -eq 0 ]]; then
    echo "[OK] local_security_audit — tamam (FAIL:0 WARN:0)"
  else
    echo "[OK] local_security_audit — kritik acik yok (WARN'leri giderin)"
  fi
  exit 0
fi
echo "[FAIL] local_security_audit — $fail kritik madde" >&2
exit 1
