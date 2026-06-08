#!/usr/bin/env bash
# JA3/UA cluster ban — canli nginx access log ingest
#   bash scripts/ja3_cluster_ban_live.sh
#   sudo bash scripts/ja3_cluster_ban_live.sh   # access.log append icin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[ja3_cluster_ban_live] FAIL: $*" >&2; exit 1; }

MIN_IPS="${JA3_CLUSTER_MIN_IPS:-3}"
COUNT="${CLUSTER_BAN_IP_COUNT:-5}"
WAIT_SEC="${CLUSTER_BAN_WAIT_SEC:-12}"
NGINX_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"
REPORT="${JA3_CLUSTER_BAN_REPORT:-ja3-cluster-ban-live.json}"

LG="${LG_BIN:-}"
[[ -z "$LG" && -x "$ROOT/log-guardian" ]] && LG="$ROOT/log-guardian"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG="/usr/local/bin/log-guardian"
[[ -x "$LG" ]] || fail "log-guardian binary yok — make && sudo make install"

echo "=== ja3_cluster_ban_live ==="
echo "min_ips=${MIN_IPS} cluster_ips=${COUNT} rules=${RULES}"

if ! grep -qE '^JA3_CLUSTER_BAN=1' "$RULES" 2>/dev/null; then
  echo "[WARN] JA3_CLUSTER_BAN=1 yok — $RULES icine ekleyin veya: sudo bash scripts/merge_ja3_cluster_rules.sh"
fi

metrics_val() {
  local key="$1"
  curl -sf --max-time 3 "http://127.0.0.1:9091/metrics" 2>/dev/null \
    | awk -v m="$key" '$1 ~ "^" m { print $2; exit }' || echo "0"
}

metrics_pipeline_total() {
  local t=0
  for k in loganalyzer_ban_pipeline_ipc loganalyzer_ban_pipeline_ipset loganalyzer_ban_pipeline_xdp; do
    t=$((t + $(metrics_val "$k")))
  done
  echo "$t"
}

pipe_before=$(metrics_pipeline_total)
alerts_before=$(metrics_val loganalyzer_alerts_total)
JOURNAL_SINCE=$(date -u +"%Y-%m-%d %H:%M:%S")

# Her kosuda farkli IP blogu — onceki cluster ban tekrarini onler
IP_OCTET=$(( ($(date +%s) % 200) + 10 ))
TMP_LOG=$(mktemp)
TS=$(LC_TIME=C date -u +"%d/%b/%Y:%H:%M:%S +0000")
# Her kosuda ayri UA — onceki cluster bucket tekrarini onler
UA="sqlmap/1.8#cluster-${IP_OCTET} (https://sqlmap.org)"
for i in $(seq 1 "$COUNT"); do
  ip="45.33.${IP_OCTET}.${i}"
  printf '%s - - [%s] "GET /search?q=1%%27+UNION+SELECT+null,null-- HTTP/1.1" 200 128 "-" "%s"\n' \
    "$ip" "$TS" "$UA" >> "$TMP_LOG"
done
echo "[INFO] test IP blogu: 45.33.${IP_OCTET}.1-45.33.${IP_OCTET}.${COUNT}"

APPEND_OK=0
FLUSH_SEEN=0
if { [[ "$(id -u)" -eq 0 ]] || [[ -w "$NGINX_LOG" ]]; } \
   && { cat "$TMP_LOG" >> "$NGINX_LOG"; } 2>/dev/null; then
  APPEND_OK=1
  echo "[OK] ${COUNT} satir nginx access log'a eklendi ($NGINX_LOG)"
  echo "[INFO] log-guardian ingest bekleniyor (${WAIT_SEC}s)..."
  sleep "$WAIT_SEC"
  if journalctl -u log-guardian --since "$JOURNAL_SINCE" --no-pager 2>/dev/null \
     | grep -q '\[JA3-CLUSTER\] flush'; then
    FLUSH_SEEN=1
    echo "[OK] journal — JA3-CLUSTER flush (bu kosu)"
  fi
else
  echo "[INFO] access.log yazilamadi — replay modu (sudo ile canli append onerilir)"
  REPLAY_RULES="$RULES"
  if ! grep -qE '^JA3_CLUSTER_BAN=1' "$REPLAY_RULES" 2>/dev/null \
     && [[ -f "$ROOT/rules.conf" ]]; then
    REPLAY_RULES="$ROOT/rules.conf"
    echo "[INFO] replay rules: $REPLAY_RULES"
  fi
  REPLAY_LOG=$(mktemp)
  "$LG" "$TMP_LOG" --no-tui --rules "$REPLAY_RULES" --no-db >"$REPLAY_LOG" 2>&1 || true
  if grep -q '\[JA3-CLUSTER\] flush' "$REPLAY_LOG"; then
    APPEND_OK=2
    FLUSH_SEEN=1
    echo "[OK] replay — JA3-CLUSTER flush goruldu"
  fi
  rm -f "$REPLAY_LOG"
fi

pipe_after=$(metrics_pipeline_total)
pipe_delta=$((pipe_after - pipe_before))
alerts_after=$(metrics_val loganalyzer_alerts_total)
alerts_delta=$((alerts_after - alerts_before))

python3 - "$REPORT" "$MIN_IPS" "$COUNT" "$APPEND_OK" "$pipe_before" "$pipe_after" \
  "$pipe_delta" "$FLUSH_SEEN" "$alerts_delta" "$NGINX_LOG" "$IP_OCTET" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

def arg(i, default="0"):
    return sys.argv[i] if len(sys.argv) > i else default

out = Path(arg(1))
min_ips = int(arg(2))
count = int(arg(3))
append_ok = int(arg(4))
pipe_before = int(arg(5))
pipe_after = int(arg(6))
pipe_delta = int(arg(7))
flush_seen = int(arg(8)) == 1
alerts_delta = int(arg(9))
nginx_log = arg(10, "")
ip_octet = arg(11, "0")

mode = "live-append" if append_ok == 1 else ("replay-cluster" if append_ok == 2 else "replay-only")
pass_cluster = (
    flush_seen
    or append_ok == 2
    or pipe_delta >= min_ips
    or (append_ok == 1 and alerts_delta >= min_ips)
)

report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": mode,
    "nginx_log": nginx_log,
    "ip_block": f"45.33.{ip_octet}.1-45.33.{ip_octet}.{count}",
    "cluster_min_ips": min_ips,
    "lines_injected": count,
    "ban_pipeline_before": pipe_before,
    "ban_pipeline_after": pipe_after,
    "ban_pipeline_delta": pipe_delta,
    "alerts_delta": alerts_delta,
    "ja3_cluster_flush_this_run": flush_seen,
    "pass": pass_cluster,
    "hint": "Tekrar kosu icin otomatik yeni IP blogu; sudo bash scripts/ja3_cluster_ban_live.sh",
}
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    f"[ja3_cluster_ban_live] mode={mode} delta={pipe_delta} alerts+={alerts_delta} "
    f"flush={flush_seen} pass={pass_cluster}"
)
sys.exit(0 if pass_cluster else 1)
PY

rm -f "$TMP_LOG"
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
echo "[OK] ja3_cluster_ban_live -> $REPORT"
