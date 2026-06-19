#!/usr/bin/env bash
# OpenAPI SchemaViolation → canli ban kaniti (nginx access.log ingest)
#   sudo bash scripts/schema_ban_live.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[schema_ban_live] FAIL: $*" >&2; exit 1; }

COUNT="${SCHEMA_BAN_IP_COUNT:-3}"
WAIT_SEC="${SCHEMA_BAN_WAIT_SEC:-25}"
NGINX_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
LG="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG" ]] || LG="$ROOT/log-guardian"
REPORT="${SCHEMA_BAN_REPORT:-schema-ban-live.json}"
ETC_EXAMPLES="/etc/log-guardian/examples/openapi-mini.json"

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail "sudo gerekli: sudo bash scripts/schema_ban_live.sh"
systemctl is-active --quiet log-guardian log-guardian-daemon 2>/dev/null \
  || fail "log-guardian + daemon aktif degil"

[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"
grep -qE '^OPENAPI_SCHEMA=' "$RULES" 2>/dev/null \
  || fail "OPENAPI_SCHEMA yok — $RULES"
grep -qE '^OPENAPI_STRICT=1' "$RULES" 2>/dev/null \
  || echo "[WARN] OPENAPI_STRICT=1 onerilir"

# Prod: OPENAPI_SCHEMA=examples/openapi-mini.json → /etc/log-guardian/examples/
if [[ ! -f "$ETC_EXAMPLES" ]]; then
  echo "[INFO] openapi-mini.json /etc altinda yok — sync_etc_rules"
  bash "$ROOT/scripts/sync_etc_rules.sh"
  systemctl restart log-guardian log-guardian-daemon 2>/dev/null || true
  sleep 4
fi
[[ -f "$ETC_EXAMPLES" ]] || fail "schema dosyasi yok: $ETC_EXAMPLES (sync_etc_rules)"

schema_loaded=$("$LG" schema-check --rules "$RULES" --stats --quiet 2>/dev/null \
  | grep -o '"loaded":true' || true)
[[ -n "$schema_loaded" ]] || fail "OpenAPI schema yuklu degil — journalctl -u log-guardian | grep SCHEMA"

metrics_val() {
  local key="$1"
  curl -sf --max-time 3 "http://127.0.0.1:9091/metrics" 2>/dev/null \
    | awk -v m="$key" '$1 ~ "^" m { print $2; exit }' || echo "0"
}

bans_before=$(metrics_val loganalyzer_bans_success)
pipe_before=$(metrics_val loganalyzer_ban_pipeline_ipc)
alerts_before=$(metrics_val loganalyzer_alerts_total)

# 200+ blogu: ja3_cluster (112-116) ve onceki schema kosulari ile carpismayi azalt
IP_BASE="${SCHEMA_BAN_IP_BASE:-200}"
TS=$(LC_TIME=C date -u +"%d/%b/%Y:%H:%M:%S +0000")
JOURNAL_SINCE=$(date -u +"%Y-%m-%d %H:%M:%S")
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

echo "=== schema_ban_live ==="
echo "  hedef=${COUNT} IP  blog=203.0.113.${IP_BASE}+  log=$NGINX_LOG"
echo "[WARN] ~${COUNT} #waf SchemaViolation + ~${COUNT} #ban (force_waf) beklenir"

for i in $(seq 0 $((COUNT - 1))); do
  ip="203.0.113.$((IP_BASE + i))"
  # Her IP farkli UA — ayni UA JA3_CLUSTER_BAN ile schema testini bozar
  ua="lg-schema-${ip}"
  printf '%s - - [%s] "POST /api/login HTTP/1.1" 400 128 "-" "%s" "-" "{\\"username\\":\\"a\\",\\"password\\":\\"b\\",\\"evil\\":1}" "X-API-Key=secret; Content-Type=application/json" "api.local"\n' \
    "$ip" "$TS" "$ua" >>"$TMP"
done

APPEND_OK=0
cat "$TMP" >>"$NGINX_LOG"
APPEND_OK=1
echo "[OK] ${COUNT} schema-violation satiri eklendi"

w=0
saw_alerts=0
saw_bans=0
while [[ "$w" -lt "$WAIT_SEC" ]]; do
  sleep 1
  w=$((w + 1))
  cur_alerts=$(metrics_val loganalyzer_alerts_total)
  cur_bans=$(metrics_val loganalyzer_bans_success)
  if [[ $((cur_alerts - alerts_before)) -ge 1 ]]; then
    saw_alerts=1
  fi
  if [[ $((cur_bans - bans_before)) -ge 1 ]]; then
    saw_bans=1
    break
  fi
done

bans_after=$(metrics_val loganalyzer_bans_success)
pipe_after=$(metrics_val loganalyzer_ban_pipeline_ipc)
alerts_after=$(metrics_val loganalyzer_alerts_total)
bans_delta=$((bans_after - bans_before))
pipe_delta=$((pipe_after - pipe_before))
alerts_delta=$((alerts_after - alerts_before))

# Canli ingest gecikirse replay ile schema alarmi dogrula
REPLAY_OK=0
if [[ "$alerts_delta" -lt 1 ]]; then
  echo "[WARN] alerts henuz yok (${w}s) — replay dogrulama"
  REPLAY_LOG=$(mktemp)
  if "$LG" "$TMP" --no-tui --no-ban --no-webhook --no-db --rules "$RULES" -t 2 >"$REPLAY_LOG" 2>&1; then
    :
  fi
  if grep -qE 'SchemaViolation|ALARM.*[Ss]chema' "$REPLAY_LOG"; then
    REPLAY_OK=1
    echo "[OK] replay — SchemaViolation goruldu (canli ingest gecikiyor olabilir)"
  else
    grep -E 'SCHEMA|ALARM|Schema' "$REPLAY_LOG" | tail -5 >&2 || true
  fi
  rm -f "$REPLAY_LOG"
fi

ipset_hits=0
for i in $(seq 0 $((COUNT - 1))); do
  ip="203.0.113.$((IP_BASE + i))"
  if ipset test log_analyzer_block_v4 "$ip" 2>/dev/null; then
    ipset_hits=$((ipset_hits + 1))
  fi
done

[[ "$saw_alerts" -eq 1 || "$REPLAY_OK" -eq 1 ]] || echo "[WARN] SchemaViolation alerti yok"

python3 - "$REPORT" "$COUNT" "$IP_BASE" "$bans_delta" "$pipe_delta" \
  "$alerts_delta" "$ipset_hits" "$saw_bans" "$APPEND_OK" "$REPLAY_OK" "$NGINX_LOG" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

out = Path(sys.argv[1])
count = int(sys.argv[2])
ip_base = int(sys.argv[3])
bans_delta = int(sys.argv[4])
pipe_delta = int(sys.argv[5])
alerts_delta = int(sys.argv[6])
ipset_hits = int(sys.argv[7])
saw_bans = int(sys.argv[8]) == 1
append_ok = int(sys.argv[9])
replay_ok = int(sys.argv[10]) == 1
nginx_log = sys.argv[11]

schema_ok = alerts_delta >= 1 or replay_ok
ban_ok = bans_delta >= 1 or ipset_hits >= 1
report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": "live-append" if append_ok == 1 else "unknown",
    "nginx_log": nginx_log,
    "ip_block": f"203.0.113.{ip_base}-203.0.113.{ip_base + count - 1}",
    "lines_injected": count,
    "bans_delta": bans_delta,
    "ban_pipeline_ipc_delta": pipe_delta,
    "alerts_delta": alerts_delta,
    "ipset_hits": ipset_hits,
    "replay_schema_ok": replay_ok,
    "pass": schema_ok and ban_ok,
}
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    f"[schema_ban_live] bans+={report['bans_delta']} ipc+={report['ban_pipeline_ipc_delta']} "
    f"alerts+={report['alerts_delta']} ipset={report['ipset_hits']}/{count} "
    f"replay_schema={report['replay_schema_ok']} pass={report['pass']}"
)
sys.exit(0 if report["pass"] else 1)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
echo "[OK] schema_ban_live -> $REPORT"
echo "[INFO] SCHEMA journal yalnizca servis baslangicinda — dogrulama:"
echo "       $LG schema-check --rules $RULES --stats --quiet"
