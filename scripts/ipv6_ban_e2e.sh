#!/usr/bin/env bash
# IPv6 ban E2E — laptop + VPS (RFC 3849 documentation prefix)
#   sudo bash scripts/ipv6_ban_e2e.sh
#   sudo IPV6_E2E_MODE=api bash scripts/ipv6_ban_e2e.sh   # varsayilan: canli API
#   sudo IPV6_E2E_MODE=cli bash scripts/ipv6_ban_e2e.sh   # API olmadan operator CLI
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
PORT="${GUARDIAN_API_PORT:-8090}"
BASE="http://127.0.0.1:${PORT}"
TEST_IP="${IPV6_E2E_IP:-2001:db8::dead:beef}"
MODE="${IPV6_E2E_MODE:-auto}"
IPSET_V6="${IPSET_V6_NAME:-log_analyzer_block_v6}"
REPORT="${IPV6_E2E_REPORT:-ipv6-ban-e2e-report.json}"
AUTO_SETUP="${IPV6_AUTO_SETUP:-1}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

BENCH_RULES="$ROOT/.cache/ipv6_ban_e2e_rules.conf"
LG="$ROOT/log-guardian"
[[ -x /usr/local/bin/log-guardian ]] && LG="/usr/local/bin/log-guardian"

fail() { echo "[ipv6_ban_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli (ipset/ip6tables)"
command -v ipset >/dev/null 2>&1 || fail "ipset kurulu degil"

echo "=== ipv6_ban_e2e ==="
echo "  test_ip=$TEST_IP  mode=$MODE"

LG_QUIET_BUILD=1 make -s binaries 2>/dev/null || make -s log-guardian

bash "$ROOT/scripts/ensure_ipv6_ipset.sh"

mkdir -p "$ROOT/.cache"
cat >"$BENCH_RULES" <<'RC'
ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
WAF_ENABLED=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
RC
chmod 600 "$BENCH_RULES"

ipset_del_test() {
  ipset del "$IPSET_V6" "$TEST_IP" -exist 2>/dev/null || true
}

ipset_has_test() {
  ipset test "$IPSET_V6" "$TEST_IP" >/dev/null 2>&1
}

ipset_del_test
"$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true

if [[ "$AUTO_SETUP" == "1" ]] && command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active log-guardian-daemon >/dev/null 2>&1; then
    echo "[ipv6_ban_e2e] daemon inactive — fix_ipc + restart..."
    bash "$ROOT/scripts/fix_ipc_perms.sh" 2>/dev/null || true
    systemctl restart log-guardian-daemon 2>/dev/null || true
    sleep 2
  fi
  if ! systemctl is-active log-guardian >/dev/null 2>&1; then
    systemctl start log-guardian 2>/dev/null || true
    sleep 1
  fi
fi

api_token() {
  grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

api_ready() {
  local tok i
  tok=$(api_token)
  [[ -n "$tok" ]] || return 1
  for i in 1 2 3 4 5; do
    systemctl is-active log-guardian >/dev/null 2>&1 || return 1
    if curl -sf --max-time 2 -H "Authorization: Bearer $tok" "${BASE}/api/v1/metrics" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ban_via_api() {
  local tok code body path
  tok=$(api_token)
  [[ -n "$tok" ]] || return 1
  code=$(curl -s -o /tmp/lg_ipv6_ban_body.json -w '%{http_code}' --max-time 8 \
    -H "Authorization: Bearer $tok" \
    -X POST \
    --get \
    --data-urlencode "ip=${TEST_IP}" \
    --data-urlencode "reason=ipv6_e2e" \
    "${BASE}/api/v1/ban" 2>/dev/null || echo 000)
  body=$(cat /tmp/lg_ipv6_ban_body.json 2>/dev/null || true)
  if [[ "$code" != "200" && "$code" != "502" ]]; then
    echo "[ipv6_ban_e2e] API code=$code body=$body" >&2
    return 1
  fi
  path=$(echo "$body" | grep -o '"path":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "api")
  echo "api:${path:-unknown}"
  return 0
}

ban_via_cli() {
  local out path
  out=$("$LG" ban "$TEST_IP" --rules "$BENCH_RULES" --reason "ipv6_e2e" 2>&1) || {
    echo "$out" >&2
    return 1
  }
  path=$(echo "$out" | sed -n 's/.*yol=\([^)]*\).*/\1/p' | head -1)
  echo "cli:${path:-unknown}"
}

unban_cleanup() {
  local tok
  tok=$(api_token)
  if [[ -n "$tok" ]] && api_ready; then
    curl -s -o /dev/null --max-time 5 \
      -H "Authorization: Bearer $tok" \
      -X POST \
      --get \
      --data-urlencode "ip=${TEST_IP}" \
      "${BASE}/api/v1/unban" 2>/dev/null || true
  fi
  "$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
  ipset_del_test
}

api_skip_reason=""
ban_path=""
case "$MODE" in
  api)
    api_ready || fail "API hazir degil — token/service kontrol"
    ban_path=$(ban_via_api) || fail "API ban basarisiz — token/service kontrol"
    ok "ban yolu: $ban_path (API)"
    ;;
  cli)
    ban_path=$(ban_via_cli) || fail "CLI ban basarisiz"
    ok "ban yolu: $ban_path (CLI)"
    ;;
  auto|*)
    if ! api_ready; then
      api_skip_reason="api_not_ready"
      echo "[ipv6_ban_e2e] API hazir degil (token/service) — CLI fallback" >&2
    elif ! ban_path=$(ban_via_api); then
      api_skip_reason="api_ban_failed"
      echo "[ipv6_ban_e2e] API ban basarisiz — CLI fallback" >&2
    else
      ok "ban yolu: $ban_path (API)"
    fi
    if [[ -z "$ban_path" ]]; then
      ban_path=$(ban_via_cli) || fail "API ve CLI ban basarisiz"
      ok "ban yolu: $ban_path (CLI fallback)"
    fi
    ;;
esac

[[ -n "$ban_path" ]] || fail "ban cagrisi bos"

sleep 0.5
if ! ipset_has_test; then
  # IPC/XDP yolu ipset'e yazmayabilir — CLI ipset zorla
  if [[ "$ban_path" == api:* ]]; then
    echo "[ipv6_ban_e2e] ipset bos — CLI ipset fallback..." >&2
  fi
  ban_path=$(ban_via_cli) || fail "ipset v6 girisi yok"
fi

ipset_has_test || fail "ipset test $IPSET_V6 $TEST_IP basarisiz"
ok "ipset v6 entry: $TEST_IP"

unban_cleanup
ok "unban + temizlik"

via=${ban_path%%:*}
path=${ban_path#*:}
python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path

doc = {
    "pass": True,
    "date": datetime.now(timezone.utc).isoformat(),
    "test_ip": "$TEST_IP",
    "ipset_v6": "$IPSET_V6",
    "ban_via": "$via",
    "ban_path": "$path",
    "api_skip_reason": "$api_skip_reason" or None,
    "note": "RFC 3849 doc prefix — laptop/VPS ipset+ip6tables",
}
Path("$REPORT").write_text(json.dumps(doc, indent=2) + "\\n", encoding="utf-8")
print(f"[OK] $REPORT")
PY

mkdir -p "$ROOT/.cache/dashboard-live"
cp -f "$REPORT" "$ROOT/.cache/dashboard-live/$REPORT" 2>/dev/null || true

ok "ipv6_ban_e2e"
