#!/usr/bin/env bash
# P7 — Attack map /api/attack-geo + globe marker kaniti
#   bash scripts/attack_map_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
REPORT="${ATTACK_MAP_REPORT:-attack-map-report.json}"
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
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[attack_map_e2e] FAIL: $*" >&2
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

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
fi

echo "=== attack_map_e2e (P7) ==="

login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code"

geo_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/attack-geo") \
  || fail "/api/attack-geo erisilemedi"

read -r marker_count total_ips data_source geo_on bans_src ack_count ban_count inc_count <<<"$(python3 -c "
import json,sys
d=json.load(sys.stdin)
markers=d.get('markers') or []
valid=sum(1 for m in markers if m.get('lat') is not None and m.get('lon') is not None)
ack=sum(1 for m in markers if m.get('kind')=='ack')
ban=sum(1 for m in markers if m.get('kind')=='ban')
inc=sum(1 for m in markers if m.get('kind')=='incident')
print(len(markers), d.get('total_ips',0), d.get('data_source','?'), d.get('geo_lookup',True), d.get('bans_source','?'), ack, ban, inc)
if valid < 1:
    raise SystemExit('geo_marker_yok')
" <<<"$geo_json")" || {
  echo "[attack_map_e2e] marker yok — dashboard_live_demo deneniyor..."
  if bash "$ROOT/scripts/dashboard_live_demo.sh" 2>/dev/null; then
    geo_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/attack-geo") \
      || fail "/api/attack-geo (retry)"
    read -r marker_count total_ips data_source geo_on bans_src ack_count ban_count inc_count <<<"$(python3 -c "
import json,sys
d=json.load(sys.stdin)
markers=d.get('markers') or []
valid=sum(1 for m in markers if m.get('lat') is not None and m.get('lon') is not None)
ack=sum(1 for m in markers if m.get('kind')=='ack')
ban=sum(1 for m in markers if m.get('kind')=='ban')
inc=sum(1 for m in markers if m.get('kind')=='incident')
print(len(markers), d.get('total_ips',0), d.get('data_source','?'), d.get('geo_lookup',True), d.get('bans_source','?'), ack, ban, inc)
if valid < 1:
    raise SystemExit('geo_marker_yok')
" <<<"$geo_json")" || fail "marker/geo yok — dashboard_live_demo veya proof IP"
  else
    fail "marker/geo yok ve live_demo basarisiz"
  fi
}

bans_count_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/bans?count_only=1") \
  || fail "/api/bans?count_only=1 erisilemedi"

read -r nav_count nav_preview nav_mode soc_ban_count <<<"$(python3 -c "
import json, sys
nav = json.loads(sys.argv[1])
nav_count = int(nav.get('count') or 0)
nav_preview = bool(nav.get('preview'))
nav_mode = str(nav.get('data_mode') or 'live')
soc = {}
try:
    soc = json.loads(sys.argv[2])
except Exception:
    pass
soc_ban = sum(1 for e in (soc.get('entries') or []) if e.get('kind') == 'ban')
print(nav_count, nav_preview, nav_mode, soc_ban)
" "$bans_count_json" "$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/soc-timeline" 2>/dev/null || echo '{}')")"

nav_parity_ok=1
if [[ "$data_source" == "live" && "$bans_src" == "ipset" && "$nav_preview" != "True" && "$nav_mode" == "live" && "$ban_count" -gt 0 ]]; then
  if [[ "$nav_count" -ne "$ban_count" ]]; then
    fail "nav/ipset parity: nav badge=$nav_count map_ban=$ban_count (demo cache? bash scripts/dashboard_refresh.sh)"
  fi
  if [[ "$soc_ban_count" -gt 0 && "$soc_ban_count" -ne "$nav_count" ]]; then
    fail "soc/ipset parity: timeline_ban=$soc_ban_count nav=$nav_count"
  fi
fi

python3 - "$REPORT" "$DASH_URL" "$marker_count" "$total_ips" "$data_source" "$geo_on" "$bans_src" "$ack_count" "$ban_count" "$inc_count" "$nav_count" "$soc_ban_count" "$nav_parity_ok" <<'PY'
import json, datetime, sys
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": True,
    "dash_url": sys.argv[2],
    "markers": int(sys.argv[3]),
    "total_ips": int(sys.argv[4]),
    "data_source": sys.argv[5],
    "geo_lookup": sys.argv[6] in ("True", "true", "1"),
    "bans_source": sys.argv[7],
    "ack_markers": int(sys.argv[8]),
    "ban_markers": int(sys.argv[9]),
    "incident_markers": int(sys.argv[10]),
    "nav_ban_count": int(sys.argv[11]),
    "soc_ban_count": int(sys.argv[12]),
    "nav_parity_ok": sys.argv[13] == "1",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] attack_map_e2e — $marker_count marker (ack=$ack_count ban=$ban_count nav=$nav_count soc_ban=$soc_ban_count), source=$data_source, bans=$bans_src"
echo "  Rapor: $REPORT"
echo "  UI: ${DASH_URL}/ (Harita) Ctrl+Shift+R"
