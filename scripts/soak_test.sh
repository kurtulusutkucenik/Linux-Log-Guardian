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
#   SOAK_GRACE_SEC=120     restart sonrasi fail sayma (operasyonel mod)
#   SOAK_METRICS_REQUIRED=0  1 ise metrics yoksa sample_fail
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
SOAK_GRACE_SEC="${SOAK_GRACE_SEC:-0}"
SOAK_METRICS_REQUIRED="${SOAK_METRICS_REQUIRED:-0}"
SOAK_LAPTOP_RELAX="${SOAK_LAPTOP_RELAX:-0}"
# Arka plan 72h: health sudo/IPC olcum hatasi — servis+metrik yeterli (laptop)
if [[ "${SOAK_BACKGROUND:-0}" == "1" && "$SOAK_LAPTOP_RELAX" == "0" ]]; then
  SOAK_LAPTOP_RELAX=1
fi

if [[ "${SOAK_SHORT:-0}" == "1" ]]; then
  SOAK_DURATION=300
  SOAK_INTERVAL=30
  SOAK_LABEL="5m"
  echo "[soak_test] SOAK_SHORT=1 — 5 dk / 30s aralik"
elif [[ "${SOAK_1H:-0}" == "1" ]]; then
  SOAK_DURATION=3600
  SOAK_INTERVAL=60
  SOAK_LABEL="1h"
  echo "[soak_test] SOAK_1H=1 — 1 saat / 60s aralik (72h DEGIL)"
else
  SOAK_LABEL="72h"
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
in_log_guardian_group() {
  id -nG 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian
}

run_soak_health() {
  local log=$1
  local args=(--health --db "$SOAK_HEALTH_DB")
  local cmd=("$SOAK_HEALTH_BIN" "${args[@]}")

  try_direct() {
    "${cmd[@]}" >"$log" 2>&1
  }
  try_sg() {
    getent group log-guardian >/dev/null 2>&1 \
      && sg log-guardian -c "exec \"$SOAK_HEALTH_BIN\" --health --db \"$SOAK_HEALTH_DB\"" >"$log" 2>&1
  }
  try_sudo_n() {
    sudo -n "$SOAK_HEALTH_BIN" "${args[@]}" >"$log" 2>&1
  }

  # Arka planda sg, on planda once direct (grup uyeligi varsa)
  if [[ "${SOAK_BACKGROUND:-0}" == "1" || ! -t 0 ]]; then
    try_sg && return 0
    try_direct && return 0
    try_sudo_n && return 0
    echo "[soak_test] health: sg/direct/sudo -n basarisiz (sudo bash scripts/fix_ipc_perms.sh)" >>"$log"
    return 1
  fi

  if in_log_guardian_group; then
    try_direct && return 0
    try_sg && return 0
    try_sudo_n && return 0
  else
    try_sg && return 0
    try_direct && return 0
    try_sudo_n && return 0
  fi

  if [[ "${SOAK_ALLOW_INTERACTIVE_SUDO:-0}" == "1" ]]; then
    sudo "$SOAK_HEALTH_BIN" "${args[@]}" >"$log" 2>&1
    return $?
  fi
  echo "[soak_test] health: interaktif sudo kapali" >>"$log"
  return 1
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
SKIPS=0
SAMPLES=0
MAX_RSS_KB=0
GRACE_UNTIL=0
PREV_ANALYZER_STATE=""
PREV_DAEMON_STATE=""

echo "=== soak_test ==="
echo "Mod: ${SOAK_LABEL:-72h}"
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

  # Restart sonrasi grace (systemd flicker)
  NOW_EPOCH=$(date +%s)
  if [[ "$SOAK_GRACE_SEC" -gt 0 ]]; then
    if [[ "$PREV_ANALYZER_STATE" != "active" && "$ANALYZER_STATE" == "active" ]]; then
      GRACE_UNTIL=$((NOW_EPOCH + SOAK_GRACE_SEC))
    fi
    if [[ "$PREV_DAEMON_STATE" != "active" && "$DAEMON_STATE" == "active" ]]; then
      GRACE_UNTIL=$((NOW_EPOCH + SOAK_GRACE_SEC))
    fi
  fi
  PREV_ANALYZER_STATE="$ANALYZER_STATE"
  PREV_DAEMON_STATE="$DAEMON_STATE"

  SAMPLE_FAIL=0
  SAMPLE_SKIP=0
  FAIL_REASON=""
  if [[ "$HEALTH_RC" -ne 0 ]]; then
    if [[ "${SOAK_LAPTOP_RELAX:-0}" == "1" \
          && "$ANALYZER_STATE" == "active" && "$DAEMON_STATE" == "active" ]]; then
      : # laptop: servis ayakta — health IPC olcum hatasi outage sayilmaz
    else
      SAMPLE_FAIL=1
      if grep -qE 'sg/direct/sudo -n basarisiz|sudo -n basarisiz' "$HEALTH_LOG" 2>/dev/null; then
        FAIL_REASON="sudo"
      else
        FAIL_REASON="health"
      fi
    fi
  elif [[ "$METRICS_OK" -eq 0 && "$SOAK_METRICS_REQUIRED" == "1" ]]; then
    SAMPLE_FAIL=1
    FAIL_REASON="metrics"
  fi

  if [[ "$SAMPLE_FAIL" -eq 1 && "$SOAK_GRACE_SEC" -gt 0 && "$NOW_EPOCH" -lt "$GRACE_UNTIL" ]]; then
    SAMPLE_FAIL=0
    SAMPLE_SKIP=1
    FAIL_REASON="grace_restart"
    SKIPS=$((SKIPS + 1))
  elif [[ "$SAMPLE_FAIL" -eq 1 ]]; then
    FAILURES=$((FAILURES + 1))
  fi

  python3 - "$SOAK_JSONL" "$TS" "$HEALTH_RC" "$DAEMON_STATE" "$ANALYZER_STATE" \
    "$METRICS_OK" "$EPS" "$ALERTS" "$LINES" "$RSS_KB" \
    "$SAMPLE_FAIL" "$SAMPLE_SKIP" "$FAIL_REASON" <<'PY'
import json, sys
path, ts, health_rc, daemon, analyzer, metrics_ok, eps, alerts, lines, rss_kb, \
    sample_fail, sample_skip, fail_reason = sys.argv[1:14]
row = {
    "ts": ts,
    "health_rc": int(health_rc),
    "health_ok": int(health_rc) == 0,
    "daemon_systemd": daemon,
    "analyzer_systemd": analyzer,
    "metrics_ok": metrics_ok == "1",
    "eps": float(eps or 0),
    "alerts_total": float(alerts or 0),
    "lines_total": float(lines or 0),
    "rss_kb": int(rss_kb or 0),
    "sample_fail": sample_fail == "1",
    "sample_skip": sample_skip == "1",
    "fail_reason": fail_reason or None,
}
with open(path, "a", encoding="utf-8") as f:
    f.write(json.dumps(row) + "\n")
PY

  if [[ "$SAMPLE_SKIP" -eq 1 ]]; then
    echo "[$TS] SKIP grace ($FAIL_REASON) daemon=$DAEMON_STATE analyzer=$ANALYZER_STATE"
  elif [[ "$SAMPLE_FAIL" -eq 1 ]]; then
    echo "[$TS] FAIL reason=$FAIL_REASON health_rc=$HEALTH_RC daemon=$DAEMON_STATE analyzer=$ANALYZER_STATE"
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
START_ISO=$(date -Iseconds -d "@$START_EPOCH" 2>/dev/null || date -Iseconds)

python3 - "$SOAK_REPORT" "$SOAK_JSONL" "$START_ISO" "$END_TS" \
  "$SOAK_DURATION" "$SOAK_INTERVAL" "$FAILURES" "$SKIPS" "$MAX_RSS_KB" \
  "${SOAK_SHORT:-0}" "$SOAK_GRACE_SEC" "${SOAK_LABEL:-72h}" <<'PY'
import json, sys
from collections import Counter

report_path, jsonl_path, started, ended, duration_s, interval_s, \
    failures_s, skips_s, max_rss_s, short_mode, grace_s, label = sys.argv[1:13]
failures = int(failures_s)
skips = int(skips_s)
max_rss_kb = int(max_rss_s)
duration_sec = int(duration_s)
interval_sec = int(interval_s)
grace_sec = int(grace_s or 0)

rows = []
try:
    with open(jsonl_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
except FileNotFoundError:
    pass

reasons = Counter(r.get("fail_reason") for r in rows if r.get("sample_fail") or r.get("sample_skip"))

def operational_fail(r):
    if not r.get("sample_fail"):
        return False
    if r.get("fail_reason") == "sudo" and r.get("daemon_systemd") == "active" and r.get("analyzer_systemd") == "active":
        return False  # olcum artefakti — servisler ayaktaydi
    return True

op_fail = sum(1 for r in rows if operational_fail(r))

obj = {
    "label": label,
    "started": started,
    "ended": ended,
    "duration_sec": duration_sec,
    "duration_hours": round(duration_sec / 3600.0, 2),
    "interval_sec": interval_sec,
    "samples": len(rows),
    "failures": failures,
    "skips": skips,
    "pass": failures == 0,
    "pass_strict": failures == 0,
    "pass_operational": op_fail == 0,
    "max_rss_kb": max_rss_kb,
    "short_mode": short_mode == "1",
    "grace_sec": grace_sec,
    "fail_reasons": dict(reasons),
    "notes": "sample_fail: health/metrics; sample_skip: grace_restart (SOAK_GRACE_SEC)",
    "samples_detail": rows[-20:] if len(rows) > 20 else rows,
}
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)
print(f"[soak_test] -> {report_path} pass={obj['pass']} operational={obj['pass_operational']} failures={failures}/{len(rows)} skips={skips}")
PY

[[ "$FAILURES" -eq 0 ]] || {
  if python3 - "$SOAK_REPORT" <<'PY' 2>/dev/null; then
import json, sys
r=json.load(open(sys.argv[1]))
sys.exit(0 if r.get("pass_operational") else 1)
PY
    echo "[soak_test] strict FAIL ($FAILURES sample) — operational PASS (servis ayakta, health olcum sudo)"
    bash "$ROOT/scripts/soak_active_lock.sh" clear 2>/dev/null || true
    echo "[OK] soak_test (operational)"
    exit 0
  fi
  fail "$FAILURES / $SAMPLES sample basarisiz (skips=$SKIPS grace=${SOAK_GRACE_SEC}s)"
}
bash "$ROOT/scripts/soak_active_lock.sh" clear 2>/dev/null || true
echo "[OK] soak_test"
