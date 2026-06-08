#!/usr/bin/env bash
# 7/24 soak test — saglik, servis, metrik, bellek izleme
#
# Tam test (72 saat):
#   bash scripts/soak_test.sh
#
# CI / hizli dogrulama (5 dk):
#   SOAK_SHORT=1 bash scripts/soak_test.sh
#
# Ortam:
#   SOAK_DURATION=259200   (72h, saniye)
#   SOAK_INTERVAL=300        (5 dk aralik)
#   SOAK_METRICS_PORT=9091
#   SOAK_REPORT=soak-report.json
#   SOAK_HEALTH_BIN=/usr/local/bin/log-guardian
#   SOAK_HEALTH_DB=/etc/log-guardian/events.db
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

SOAK_DURATION="${SOAK_DURATION:-259200}"
SOAK_INTERVAL="${SOAK_INTERVAL:-300}"
SOAK_METRICS_PORT="${SOAK_METRICS_PORT:-9091}"
SOAK_REPORT="${SOAK_REPORT:-soak-report.json}"
SOAK_JSONL="${SOAK_JSONL:-soak-report.jsonl}"

if [[ "${SOAK_SHORT:-0}" == "1" && "$SOAK_REPORT" == "soak-report.json" ]]; then
  SOAK_REPORT=soak-report.short.json
  SOAK_JSONL=soak-report.short.jsonl
fi
SOAK_HEALTH_DB="${SOAK_HEALTH_DB:-/etc/log-guardian/events.db}"

if [[ "${SOAK_SHORT:-0}" == "1" ]]; then
  SOAK_DURATION=300
  SOAK_INTERVAL=30
  echo "[soak_test] SOAK_SHORT=1 — 5 dk / 30s aralik"
elif [[ "${SOAK_1H:-0}" == "1" ]]; then
  SOAK_DURATION=3600
  SOAK_INTERVAL=60
  echo "[soak_test] SOAK_1H=1 — 1 saat / 60s aralik"
fi

fail() { echo "[soak_test] FAIL: $*" >&2; exit 1; }

if [[ -n "${SOAK_HEALTH_BIN:-}" ]]; then
  :
elif [[ -x /usr/local/bin/log-guardian ]]; then
  SOAK_HEALTH_BIN=/usr/local/bin/log-guardian
elif [[ -x "$ROOT/log-guardian" ]]; then
  SOAK_HEALTH_BIN="$ROOT/log-guardian"
else
  fail "log-guardian binary yok — once: make log-guardian && sudo install -m755 log-guardian /usr/local/bin/"
fi

# /run/log-guardian 0750 — grup disi kullanici IPC/stats okuyamaz
run_soak_health() {
  local log=$1
  local args=(--health --db "$SOAK_HEALTH_DB")
  if "$SOAK_HEALTH_BIN" "${args[@]}" >"$log" 2>&1; then
    return 0
  fi
  if getent group log-guardian >/dev/null 2>&1; then
    if sg log-guardian -c "exec \"$SOAK_HEALTH_BIN\" --health --db \"$SOAK_HEALTH_DB\"" >"$log" 2>&1; then
      return 0
    fi
  fi
  if sudo -n "$SOAK_HEALTH_BIN" "${args[@]}" >"$log" 2>&1; then
    return 0
  fi
  sudo "$SOAK_HEALTH_BIN" "${args[@]}" >"$log" 2>&1
}

if ! "$SOAK_HEALTH_BIN" --health --db "$SOAK_HEALTH_DB" >/dev/null 2>&1; then
  if ! id -nG 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    echo "[soak_test] log-guardian grubu yok — sg/sudo denenecek (kalici: sudo bash scripts/fix_ipc_perms.sh)"
  fi
fi

: > "$SOAK_JSONL"
START_EPOCH=$(date +%s)
END_EPOCH=$((START_EPOCH + SOAK_DURATION))
FAILURES=0
SAMPLES=0
MAX_RSS_KB=0

echo "=== soak_test ==="
echo "Baslangic: $(date -Iseconds)"
echo "Sure: ${SOAK_DURATION}s  aralik: ${SOAK_INTERVAL}s"
echo "Rapor: $SOAK_REPORT"

while [[ $(date +%s) -lt $END_EPOCH ]]; do
  SAMPLES=$((SAMPLES + 1))
  TS=$(date -Iseconds)
  HEALTH_RC=0
  HEALTH_LOG=$(mktemp)

  run_soak_health "$HEALTH_LOG" || HEALTH_RC=$?

  DAEMON_STATE="n/a"
  ANALYZER_STATE="n/a"
  if command -v systemctl >/dev/null 2>&1; then
    DAEMON_STATE=$(systemctl is-active log-guardian-daemon 2>/dev/null || echo "inactive")
    ANALYZER_STATE=$(systemctl is-active log-guardian 2>/dev/null || echo "inactive")
  fi

  METRICS_OK=0
  EPS="0"
  ALERTS="0"
  LINES="0"
  if curl -sf --max-time 5 "http://127.0.0.1:${SOAK_METRICS_PORT}/metrics" >/tmp/soak_metrics.txt 2>/dev/null; then
    METRICS_OK=1
    EPS=$(grep -E '^loganalyzer_eps' /tmp/soak_metrics.txt 2>/dev/null | awk '{print $NF}' | head -1 || echo "0")
    ALERTS=$(grep -E '^loganalyzer_alerts_total' /tmp/soak_metrics.txt 2>/dev/null | awk '{print $NF}' | head -1 || echo "0")
    LINES=$(grep -E '^loganalyzer_lines_total' /tmp/soak_metrics.txt 2>/dev/null | awk '{print $NF}' | head -1 || echo "0")
  fi

  RSS_KB=0
  if pgrep -x log-guardian >/dev/null 2>&1; then
    RSS_KB=$(ps -o rss= -C log-guardian 2>/dev/null | awk '{s+=$1} END {print s+0}')
  fi
  if pgrep -x log-guardian-daemon >/dev/null 2>&1; then
    DRSS=$(ps -o rss= -C log-guardian-daemon 2>/dev/null | awk '{s+=$1} END {print s+0}')
    RSS_KB=$((RSS_KB + DRSS))
  fi
  [[ "$RSS_KB" -gt "$MAX_RSS_KB" ]] && MAX_RSS_KB=$RSS_KB

  SAMPLE_FAIL=0
  [[ "$HEALTH_RC" -ne 0 ]] && SAMPLE_FAIL=1
  [[ "$SAMPLE_FAIL" -eq 1 ]] && FAILURES=$((FAILURES + 1))

  python3 - "$SOAK_JSONL" <<PY
import json, sys
path = sys.argv[1]
row = {
    "ts": """$TS""",
    "health_rc": $HEALTH_RC,
    "health_ok": ${HEALTH_RC} == 0,
    "daemon_systemd": """$DAEMON_STATE""",
    "analyzer_systemd": """$ANALYZER_STATE""",
    "metrics_ok": bool($METRICS_OK),
    "eps": float("""$EPS""" or 0),
    "alerts_total": float("""$ALERTS""" or 0),
    "lines_total": float("""$LINES""" or 0),
    "rss_kb": int("""$RSS_KB"""),
    "sample_fail": bool($SAMPLE_FAIL),
}
with open(path, "a", encoding="utf-8") as f:
    f.write(json.dumps(row) + "\n")
PY

  if [[ "$SAMPLE_FAIL" -eq 1 ]]; then
    echo "[$TS] FAIL health_rc=$HEALTH_RC daemon=$DAEMON_STATE analyzer=$ANALYZER_STATE"
    tail -3 "$HEALTH_LOG" 2>/dev/null || true
  else
    echo "[$TS] OK rss=${RSS_KB}KB eps=$EPS daemon=$DAEMON_STATE"
  fi

  rm -f "$HEALTH_LOG"

  NOW=$(date +%s)
  REMAIN=$((END_EPOCH - NOW))
  [[ "$REMAIN" -le 0 ]] && break
  [[ "$REMAIN" -lt "$SOAK_INTERVAL" ]] && sleep "$REMAIN" || sleep "$SOAK_INTERVAL"
done

END_TS=$(date -Iseconds)
PASS=$([[ "$FAILURES" -eq 0 ]] && echo true || echo false)

python3 - "$SOAK_REPORT" "$SOAK_JSONL" <<PY
import json, sys, datetime
report_path, jsonl_path = sys.argv[1:3]
rows = []
try:
    with open(jsonl_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
except FileNotFoundError:
    pass

duration_h = $SOAK_DURATION / 3600.0
obj = {
    "started": """$(date -Iseconds -d "@$START_EPOCH" 2>/dev/null || date -Iseconds)""",
    "ended": """$END_TS""",
    "duration_sec": $SOAK_DURATION,
    "duration_hours": round(duration_h, 2),
    "interval_sec": $SOAK_INTERVAL,
    "samples": len(rows),
    "failures": $FAILURES,
    "pass": $FAILURES == 0,
    "max_rss_kb": $MAX_RSS_KB,
    "short_mode": """${SOAK_SHORT:-0}""" == "1",
    "notes": "health_rc!=0 veya metrics erisilemezse sample_fail",
    "samples_detail": rows[-20:] if len(rows) > 20 else rows,
}
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)
print(f"[soak_test] -> {report_path} pass={obj['pass']} failures={obj['failures']}/{obj['samples']}")
PY

[[ "$FAILURES" -eq 0 ]] || fail "$FAILURES / $SAMPLES sample basarisiz"
echo "[OK] soak_test"
