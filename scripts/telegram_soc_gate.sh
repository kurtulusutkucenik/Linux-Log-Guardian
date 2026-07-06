#!/usr/bin/env bash
# Sprint Y — Telegram SOC unified: timeline + attack map + webhook panel
#   bash scripts/telegram_soc_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
REPORT="${TELEGRAM_SOC_GATE_REPORT:-telegram-soc-gate-report.json}"
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
  'script': 'scripts/telegram_soc_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[telegram_soc_gate] FAIL: $*" >&2
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

echo "=== telegram_soc_gate (Sprint Y+AA) ==="

login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code"

soc_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/soc-timeline") \
  || fail "/api/soc-timeline erisilemedi"
ops_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/webhook-ops") \
  || fail "/api/webhook-ops erisilemedi"
geo_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/attack-geo") \
  || fail "/api/attack-geo erisilemedi"
acks_json=$(dash_curl -sf -b "$COOKIE_JAR" "${DASH_URL}/api/telegram-acks") \
  || fail "/api/telegram-acks erisilemedi"

status_acks=0
for p in "$ROOT/guardian-status.json" "$ROOT/.cache/dashboard-live/guardian-status.json"; do
  if [[ -f "$p" ]]; then
    status_acks=$(python3 -c "
import json,re,sys
d=json.load(open(sys.argv[1]))
acks=d.get('recent_telegram_acks') or []
ipv4=re.compile(r'^\d{1,3}(\.\d{1,3}){3}$')
print(sum(1 for a in acks if ipv4.match(str(a.get('ack_key') or ''))))
" "$p" 2>/dev/null || echo 0)
    break
  fi
done

python3 - "$REPORT" "$DASH_URL" "$soc_json" "$ops_json" "$geo_json" "$acks_json" "$status_acks" <<'PY'
import json, datetime, re, sys
from pathlib import Path

report_path, dash_url = sys.argv[1], sys.argv[2]
soc = json.loads(sys.argv[3])
ops = json.loads(sys.argv[4])
geo = json.loads(sys.argv[5])
acks_api = json.loads(sys.argv[6])
status_acks = int(sys.argv[7])

entries = soc.get("entries") or []
markers = geo.get("markers") or []
by_ip = acks_api.get("by_ip") or {}
bans_acks = len(by_ip) if isinstance(by_ip, dict) else 0
soc_ack = sum(1 for e in entries if e.get("kind") == "ack")
soc_ban = sum(1 for e in entries if e.get("kind") == "ban")
soc_lineage = sum(1 for e in entries if e.get("kind") == "lineage")
soc_waf = sum(1 for e in entries if e.get("kind") == "waf")
map_ack = sum(1 for m in markers if m.get("kind") == "ack")
map_ban = sum(1 for m in markers if m.get("kind") == "ban")
prod_ok = ops.get("prod_e2e_ok") is True
undo_ok = ops.get("undo_e2e_ok") is True
webhook_ok = prod_ok or undo_ok

reasons = []
if len(entries) < 1:
    reasons.append("soc_timeline_bos")
if not webhook_ok:
    reasons.append("webhook_ops_kanit_yok")
if len(markers) < 1:
    reasons.append("attack_geo_marker_yok")
if status_acks > 0 and soc_ack < 1:
    reasons.append("soc_ack_eksik")
if status_acks > 0 and map_ack < 1 and map_ban < 1:
    reasons.append("map_telegram_katman_zayif")
if status_acks > 0 and bans_acks < 1:
    reasons.append("bans_ack_api_eksik")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "dash_url": dash_url,
    "soc_entries": len(entries),
    "soc_ack": soc_ack,
    "soc_ban": soc_ban,
    "soc_lineage": soc_lineage,
    "soc_waf": soc_waf,
    "map_markers": len(markers),
    "map_ack": map_ack,
    "map_ban": map_ban,
    "bans_acks": bans_acks,
    "status_acks": status_acks,
    "prod_e2e_ok": prod_ok,
    "undo_e2e_ok": undo_ok,
    "data_mode": ops.get("data_mode"),
    "script": "scripts/telegram_soc_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
if not ok:
    raise SystemExit(out["fail_reason"])
print(f"soc={len(entries)} ack={soc_ack} ban={soc_ban} lg={soc_lineage} map={len(markers)} bans_acks={bans_acks} webhook={'OK' if webhook_ok else 'FAIL'}")
PY

echo "[OK] telegram_soc_gate — timeline + map + webhook + bans ack"
echo "  Rapor: $REPORT"
echo "  UI: ${DASH_URL}/ (Ctrl+Shift+R)"
