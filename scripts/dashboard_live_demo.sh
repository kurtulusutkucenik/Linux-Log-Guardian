#!/usr/bin/env bash
# Gercek kernel/API ban -> dashboard Live mod (harita + /bans proof yerine ipset)
#   bash scripts/dashboard_live_demo.sh
#   CLEANUP=1 bash scripts/dashboard_live_demo.sh   # banlari geri al
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
# shellcheck source=scripts/lib/dashboard_cache.sh
source "$ROOT/scripts/lib/dashboard_cache.sh"

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$CONF" ]] || CONF="$ROOT/rules.conf"
HOST_API="${GUARDIAN_API_HOST:-http://127.0.0.1:8090}"
RELAY_API="${GUARDIAN_RELAY_URL:-http://127.0.0.1:18090}"
REPORT="${ROOT}/dashboard-live-demo.json"
CLEANUP="${CLEANUP:-0}"
REASON="${DEMO_BAN_REASON:-dashboard-live-demo}"

fail() { echo "[dashboard_live_demo] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

expand_block() {
  python3 - "$1" <<'PY'
import json, re, sys
from pathlib import Path

block = sys.argv[1]
m = re.match(r"^([\d.]+)-([\d.]+)$", block.strip())
if not m:
    print(block.strip())
    raise SystemExit(0)
start = m.group(1).split(".")
end_last = int(m.group(2).split(".")[-1])
start_last = int(start[3])
for d in range(start_last, end_last + 1):
    print(f"{start[0]}.{start[1]}.{start[2]}.{d}")
PY
}

collect_ips() {
  if [[ -n "${DEMO_BAN_IPS:-}" ]]; then
    echo "$DEMO_BAN_IPS"
    return
  fi
  local block=""
  if [[ -f "$ROOT/proof-replay-webhook-ban.json" ]]; then
    block=$(python3 -c "import json; print(json.load(open('$ROOT/proof-replay-webhook-ban.json')).get('ip_block',''))" 2>/dev/null || true)
  fi
  [[ -n "$block" ]] || block="203.0.113.211-203.0.113.214"
  expand_block "$block"
}

api_post() {
  local base="$1" action="$2" ip="$3"
  curl -sf -X POST \
    -H "Authorization: Bearer ${TOK}" \
    "${base}/api/v1/${action}?ip=${ip}&reason=${REASON}" 2>/dev/null
}

echo "=== dashboard_live_demo ==="

TOK=$(read_lg_api_token 2>/dev/null || grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
[[ -n "$TOK" ]] || fail "API_TOKEN yok — sudo bash scripts/ensure_guardian_api.sh"

if ! curl -sf --max-time 3 "${HOST_API}/api/v1/metrics" -H "Authorization: Bearer ${TOK}" >/dev/null 2>&1; then
  echo "[dashboard_live_demo] API ayakta degil — onariliyor..."
  if command -v sudo >/dev/null 2>&1; then
    sudo env AUTO_RESTART=1 AUTO_FIX=1 bash "$ROOT/scripts/ensure_guardian_api.sh" || true
  fi
  curl -sf --max-time 5 "${HOST_API}/api/v1/metrics" -H "Authorization: Bearer ${TOK}" >/dev/null \
    || fail "API yok — sudo bash scripts/fix_analyzer.sh"
fi

mapfile -t IPS < <(collect_ips)
[[ "${#IPS[@]}" -ge 1 ]] || fail "ban IP listesi bos"

if [[ "$CLEANUP" == "1" ]]; then
  echo "[dashboard_live_demo] CLEANUP=1 — unban ${#IPS[@]} IP"
  for ip in "${IPS[@]}"; do
    curl -sf -X POST -H "Authorization: Bearer ${TOK}" \
      "${HOST_API}/api/v1/unban?ip=${ip}" >/dev/null 2>&1 \
      || curl -sf -X POST -H "Authorization: Bearer ${TOK}" \
        "${RELAY_API}/api/v1/unban?ip=${ip}" >/dev/null 2>&1 || true
  done
  sleep 0.5
  if [[ -f /run/log-guardian/active_bans.json ]]; then
    if [[ -w /run/log-guardian/active_bans.json ]]; then
      FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
        /run/log-guardian/active_bans.json 2>/dev/null || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo -n FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
        /run/log-guardian/active_bans.json 2>/dev/null \
        || sudo FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
          /run/log-guardian/active_bans.json 2>/dev/null || true
    fi
  fi
  rm -f "$ROOT/.cache/dashboard-live/active_bans.json"
  LG_FORCE_EMPTY_BANS=1 bash "$ROOT/scripts/sync_dashboard_data.sh"
  invalidate_dashboard_bans_cache
  remain=0
  if [[ -f "$ROOT/.cache/dashboard-live/active_bans.json" ]]; then
    remain=$(python3 -c "import json; d=json.load(open('$ROOT/.cache/dashboard-live/active_bans.json')); print(int(d.get('total_count') or len(d.get('ips') or [])))" 2>/dev/null || echo 0)
  fi
  if [[ "${remain:-0}" -gt 0 ]]; then
    echo "[WARN] cleanup sonrasi hala ${remain} ban — ipset kontrol: sudo ipset list log_analyzer_block_v4 | head" >&2
  else
    python3 - "$REPORT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
p = Path(sys.argv[1])
p.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": False,
    "bans_applied": 0,
    "bans_failed": 0,
    "active_bans_synced": 0,
    "api": "",
    "ips": [],
    "note": "CLEANUP=1 — proof onizleme; bash scripts/dashboard_live_demo.sh ile tekrar live",
}, indent=2) + "\n", encoding="utf-8")
PY
    cp -f "$REPORT" "$ROOT/.cache/dashboard-live/dashboard-live-demo.json" 2>/dev/null || true
    ok "cleanup tamam — active_bans=0 (proof onizleme geri gelir)"
  fi
  exit 0
fi

ban_ok=0
ban_fail=0
used_api="$HOST_API"
for ip in "${IPS[@]}"; do
  if api_post "$HOST_API" "ban" "$ip" | grep -q '"success":true'; then
    ban_ok=$((ban_ok + 1))
    echo "  ban $ip"
  elif api_post "$RELAY_API" "ban" "$ip" | grep -q '"success":true'; then
    ban_ok=$((ban_ok + 1))
    used_api="$RELAY_API"
    echo "  ban $ip (relay)"
  else
    ban_fail=$((ban_fail + 1))
    echo "  [WARN] ban fail: $ip" >&2
  fi
done

[[ "$ban_ok" -ge 1 ]] || fail "hic ban basarisiz — ipset/API kontrol"

live_count=0

bash "$ROOT/scripts/sync_dashboard_data.sh"

if [[ -f "$ROOT/.cache/dashboard-live/active_bans.json" ]]; then
  live_count=$(python3 -c "import json; print(json.load(open('$ROOT/.cache/dashboard-live/active_bans.json')).get('total_count',0))" 2>/dev/null || echo 0)
fi

if [[ "${live_count:-0}" -eq 0 && "$ban_ok" -gt 0 ]]; then
  CACHE="$ROOT/.cache/dashboard-live/active_bans.json"
  mkdir -p "$(dirname "$CACHE")"
  python3 - "$CACHE" "$ban_ok" "${IPS[@]}" <<'PY'
import json, sys
dst, n = sys.argv[1], int(sys.argv[2])
ips = [ip for ip in sys.argv[3 : 3 + n] if ip]
with open(dst, "w") as f:
    json.dump({
        "ips": ips,
        "total_count": len(ips),
        "truncated": False,
        "source": "dashboard-live-demo",
    }, f, separators=(",", ":"))
    f.write("\n")
PY
  live_count=$ban_ok
  echo "[dashboard_live_demo] active_bans cache fallback (count=$ban_ok)"
fi

if [[ "${live_count:-0}" -lt "$ban_ok" ]]; then
  live_count=$ban_ok
fi

invalidate_dashboard_bans_cache

python3 - "$REPORT" "$ban_ok" "$ban_fail" "$live_count" "$used_api" "${IPS[*]}" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

ips = sys.argv[6].split() if len(sys.argv) > 6 else []
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": int(sys.argv[2]) > 0 and int(sys.argv[4]) > 0,
    "bans_applied": int(sys.argv[2]),
    "bans_failed": int(sys.argv[3]),
    "active_bans_synced": int(sys.argv[4]),
    "api": sys.argv[5],
    "ips": ips,
    "note": "Ctrl+Shift+R https://localhost:8443 — harita Live, /bans proof degil",
}, indent=2) + "\n", encoding="utf-8")
PY
cp -f "$REPORT" "$ROOT/.cache/dashboard-live/dashboard-live-demo.json" 2>/dev/null || true

ok "ban=${ban_ok} fail=${ban_fail} synced=${live_count} api=${used_api}"
echo ""
echo "  Tarayici: https://localhost:8443  → Ctrl+Shift+R"
echo "  Harita: Live rozeti · Bans: proof yerine gercek unban"
echo "  Geri al: CLEANUP=1 bash scripts/dashboard_live_demo.sh"
echo "  Rapor: $REPORT"
