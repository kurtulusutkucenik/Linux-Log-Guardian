#!/usr/bin/env bash
# Sprint Z/AA — /api/telegram-acks + bans sayfasi operatör katmani
#   bash scripts/bans_telegram_ops_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
REPORT="${BANS_TELEGRAM_OPS_REPORT:-bans-telegram-ops-report.json}"
TEST_IP="${TEST_IP:-203.0.113.198}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/bans_telegram_ops_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[bans_telegram_ops_e2e] FAIL: $*" >&2
  exit 1
}

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH_URL="$(resolve_dash_url)"
CURL_TLS=()
CURL_RESOLVE=()
[[ "$DASH_URL" == https://* ]] && CURL_TLS=(-k)
if [[ "$DASH_URL" == https://localhost:* ]]; then
  port="${DASH_URL#https://localhost:}"
  port="${port%%/*}"
  CURL_RESOLVE=(--resolve "localhost:${port}:127.0.0.1")
fi

dash_curl() {
  curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" "$@"
}

if [[ -f "$ROOT/dashboard/.env.local" ]]; then
  val=$(grep -E '^DASHBOARD_ADMIN_PASSWORD=' "$ROOT/dashboard/.env.local" 2>/dev/null \
    | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  [[ -n "$val" ]] && ADMIN_PASS="$val"
fi
if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
fi

echo "=== bans_telegram_ops_e2e ==="

refresh_ban_feed() {
  local dest="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
  mkdir -p "$dest"
  if [[ -f /run/log-guardian/active_bans.json ]]; then
    if [[ -w /run/log-guardian/active_bans.json ]]; then
      FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
        /run/log-guardian/active_bans.json 2>/dev/null || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo -n FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
        /run/log-guardian/active_bans.json 2>/dev/null || true
    fi
    if [[ -r /run/log-guardian/active_bans.json ]]; then
      cp -f /run/log-guardian/active_bans.json "$dest/active_bans.json" 2>/dev/null \
        || sudo -n cp -f /run/log-guardian/active_bans.json "$dest/active_bans.json" 2>/dev/null || true
    fi
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
    sudo -n cp -f /run/log-guardian/active_bans.json "$dest/active_bans.json" 2>/dev/null || true
  fi
}

login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code"

acks_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/telegram-acks") \
  || fail "/api/telegram-acks erisilemedi"

# Dashboard bans cache + active_bans.json tazele (webhook_prod ingest sonrasi)
if [[ "${REQUIRE_BAN:-0}" == "1" ]]; then
  refresh_ban_feed
fi
dash_curl -sf -b "$COOKIE_JAR" -X POST "${DASH_URL}/api/bans" -o /dev/null 2>/dev/null || true

bans_json=""
ban_try=1
ban_tries=3
while [[ "$ban_try" -le "$ban_tries" ]]; do
  if [[ "${REQUIRE_BAN:-0}" == "1" && "$ban_try" -gt 1 ]]; then
    refresh_ban_feed
    dash_curl -sf -b "$COOKIE_JAR" -X POST "${DASH_URL}/api/bans" -o /dev/null 2>/dev/null || true
    sleep 0.4
  fi
  bans_json=$(dash_curl -sf -b "$COOKIE_JAR" \
    "${DASH_URL}/api/bans?search=${TEST_IP}&limit=5&bust=1&_t=${ban_try}") \
    && break || bans_json=""
  ban_try=$((ban_try + 1))
done
[[ -n "$bans_json" ]] || fail "/api/bans search erisilemedi"

python3 - "$REPORT" "$DASH_URL" "$TEST_IP" "$acks_json" "$bans_json" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path, dash_url, test_ip = sys.argv[1], sys.argv[2], sys.argv[3]
acks = json.loads(sys.argv[4])
bans = json.loads(sys.argv[5])

by_ip = acks.get("by_ip") or {}
count = int(acks.get("count") or len(by_ip))
test_ack = by_ip.get(test_ip)
ban_rows = bans.get("bans") or []
ips_list = bans.get("ips") or []
ban_hit = any(r.get("ip") == test_ip for r in ban_rows) or test_ip in ips_list
ban_via = "api" if ban_hit else None

require_ban = __import__("os").environ.get("REQUIRE_BAN", "0") == "1"
if require_ban and not ban_hit:
    import subprocess

    def ipset_has(ip: str) -> bool:
        for cmd in (
            ["ipset", "test", "log_analyzer_block_v4", ip],
            ["sudo", "-n", "ipset", "test", "log_analyzer_block_v4", ip],
        ):
            try:
                subprocess.run(cmd, capture_output=True, check=True, timeout=3)
                return True
            except Exception:
                continue
        return False

    if ipset_has(test_ip):
        ban_hit = True
        ban_via = "ipset_sync"

reasons = []
if not isinstance(by_ip, dict):
    reasons.append("by_ip_dict_degil")
if count < 0:
    reasons.append("count_negatif")
require_ban = __import__("os").environ.get("REQUIRE_BAN", "0") == "1"
if require_ban and not ban_hit:
    reasons.append("test_ip_ban_yok")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "dash_url": dash_url,
    "acks_count": count,
    "test_ip": test_ip,
    "test_ip_ack": test_ack is not None,
    "test_ip_operator": (test_ack or {}).get("operator") if test_ack else None,
    "test_ip_banned": ban_hit,
    "bans_search_count": bans.get("count", 0),
    "script": "scripts/bans_telegram_ops_e2e.sh",
}
if ban_via:
    out["ban_via"] = ban_via
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
if not ok:
    raise SystemExit(out["fail_reason"])
print(f"acks={count} test_ip={test_ip} ack={'yes' if test_ack else 'no'} ban_search={ban_hit}")
PY

echo "[OK] bans_telegram_ops_e2e"
echo "  Rapor: $REPORT"
echo "  UI: ${DASH_URL}/bans?search=${TEST_IP}"
if [[ "${REQUIRE_BAN:-0}" == "1" ]]; then
  banned=$(python3 -c "import json; print('yes' if json.load(open('$REPORT')).get('test_ip_banned') else 'no')")
  [[ "$banned" == "yes" ]] || echo "[WARN] REQUIRE_BAN=1 ama /api/bans aramasinda IP yok — relay gecikmesi?" >&2
fi
