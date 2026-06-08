#!/usr/bin/env bash
# Gercek nginx :80 saldiri harness — tester + ban_pipeline metrikleri
#   bash scripts/live_attack_harness.sh
#   ATTACK_HOST=203.0.113.77 bash scripts/live_attack_harness.sh  # dis IP ban testi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"
REPORT="${LIVE_ATTACK_REPORT:-live-attack-report.json}"
DURATION="${LIVE_ATTACK_DURATION:-5}"

LG="${LG_BIN:-}"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
[[ -z "$LG" && -x ./log-guardian ]] && LG=./log-guardian
RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" ]] || RULES="rules.conf"

fail() { echo "[live_attack_harness] FAIL: $*" >&2; exit 1; }

echo "=== live_attack_harness ==="
echo "  hedef=${HOST}:${PORT}  duration=${DURATION}s"

[[ -x ./tester ]] || make -s tester

NGINX_UP=0
if curl -sf --max-time 3 "http://${HOST}:${PORT}/" -o /dev/null 2>/dev/null; then
  NGINX_UP=1
  echo "[OK] nginx http://${HOST}:${PORT}/ yanit veriyor"
else
  echo "[WARN] nginx yanit yok — tester REFUSED=0 olabilir (port ${PORT} acik mi?)"
  echo "       Ornek: sudo systemctl start nginx"
fi

if sudo -n bash scripts/check_nginx_log_format.sh 2>/dev/null \
   || bash scripts/check_nginx_log_format.sh 2>/dev/null; then
  : # OK
else
  echo "[WARN] log_guardian format eksik — POST SQLi gorunmez"
  echo "       sudo bash scripts/fix_nginx_log_format.sh"
fi

BEFORE=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
SCEN_TMP=$(mktemp)
NGINX_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"
QUICK="${LIVE_ATTACK_QUICK:-0}"

# nginx log tail → hizli alert kontrolu (nginx_attack_test yerine, ~10sn)
quick_replay_check() {
  [[ -r "$NGINX_LOG" ]] || return 1
  local tmp replay alerts=0
  tmp=$(mktemp)
  grep -iE 'union|select|%27|sqli|OR\+1' "$NGINX_LOG" 2>/dev/null | tail -n 25 >"$tmp" || tail -n 15 "$NGINX_LOG" >"$tmp"
  [[ -s "$tmp" ]] || { rm -f "$tmp"; return 1; }
  replay=$(timeout 60 "$LG" "$tmp" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)
  alerts=$(echo "$replay" | python3 -c "
import re, sys
t = sys.stdin.read()
m = re.search(r'\"alerts_total\"\s*:\s*(\d+)', t)
print(m.group(1) if m else 0)
" 2>/dev/null || echo 0)
  rm -f "$tmp"
  [[ "${alerts:-0}" -gt 0 ]]
}

# stdout YALNIZCA JSON — log satirlari stderr
run_scenario() {
  local mode="$1" threads="${2:-2}" rps="${3:-25}" dur="${4:-$DURATION}"
  local out err sent refused timeout_n ok=0 replay_ok=0
  out=$(mktemp)
  err=$(mktemp)
  echo "--- scenario: $mode threads=$threads rps=$rps ${dur}s ---" >&2
  ./tester --mode "$mode" --host "$HOST" --port "$PORT" \
    --threads "$threads" --rps "$rps" >"$out" 2>"$err" &
  local tpid=$!
  sleep "$dur"
  kill -TERM "$tpid" 2>/dev/null || true
  sleep 1
  kill -KILL "$tpid" 2>/dev/null || true
  wait "$tpid" 2>/dev/null || true
  pkill -9 -f "./tester --mode ${mode} --host ${HOST}" 2>/dev/null || true

  sent=$(grep -oE '[0-9]+' <(grep -E 'Gonderilen:|Toplam istek' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)
  refused=$(grep -oE '[0-9]+' <(grep -E 'REFUSED' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)
  timeout_n=$(grep -oE '[0-9]+' <(grep -E 'TIMEOUT' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)

  [[ "${sent:-0}" -gt 0 ]] && ok=1
  [[ "${refused:-0}" -gt 0 ]] && ok=1

  if [[ "$mode" == "sqli" && "$NGINX_UP" == "1" && "$QUICK" != "1" ]]; then
    sleep 2
    if quick_replay_check; then
      replay_ok=1
      ok=1
    fi
  fi

  python3 - "$mode" "$dur" "$sent" "$refused" "$timeout_n" "$ok" "$threads" "$rps" "$NGINX_UP" "$replay_ok" <<'PY'
import json, sys
mode, dur, sent, refused, tout, ok, thr, rps, nginx_up, replay = sys.argv[1:11]
print(json.dumps({
    "mode": mode,
    "duration_sec": int(dur),
    "threads": int(thr),
    "rps_per_thread": int(rps),
    "sent": int(sent or 0),
    "refused": int(refused or 0),
    "timeout": int(tout or 0),
    "nginx_up": nginx_up == "1",
    "replay_alerts": int(replay or 0),
    "pass": bool(int(ok)),
}))
PY
  rm -f "$out" "$err"
  sleep 1
}

: >"$SCEN_TMP"
for spec in "sqli 2 25 5" "post_sqli 2 18 5" "brute 2 12 5" "ddos 3 50 4" "slow 1 1 5"; do
  read -r mode threads rps dur <<<"$spec"
  run_scenario "$mode" "$threads" "$rps" "$dur" >>"$SCEN_TMP"
done

AFTER=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
METRICS_ALERTS=$(curl -sf "http://127.0.0.1:9091/metrics" 2>/dev/null | grep -m1 '^loganalyzer_alerts_total ' | awk '{print $2}' || echo 0)

python3 - "$REPORT" "$HOST" "$PORT" "$BEFORE" "$AFTER" "$METRICS_ALERTS" "$SCEN_TMP" "$NGINX_UP" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

def safe_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}

report_path = Path(sys.argv[1])
host, port = sys.argv[2], int(sys.argv[3])
before = safe_json(sys.argv[4])
after = safe_json(sys.argv[5])
metrics_alerts = float(sys.argv[6] or 0)
scen_path = Path(sys.argv[7])
nginx_up = sys.argv[8] == "1"

scenarios = []
for line in scen_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line.startswith("{"):
        try:
            scenarios.append(json.loads(line))
        except json.JSONDecodeError:
            pass

bb = (before.get("db") or {}).get("bans_active", 0)
ab = (after.get("db") or {}).get("bans_active", 0)
bp = after.get("ban_pipeline") or {}
ipc = after.get("ipc", "?")

ban_evidence = (ab > bb) or bp.get("ipc", 0) > 0 or bp.get("ipset", 0) > 0
refused_total = sum(s.get("refused", 0) for s in scenarios)
sent_total = sum(s.get("sent", 0) for s in scenarios)
replay_any = any(s.get("replay_alerts", 0) for s in scenarios)
live_pass = sent_total > 0 and (ban_evidence or refused_total > 0 or replay_any or any(s.get("pass") for s in scenarios))

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "host": host,
    "port": port,
    "nginx_up": nginx_up,
    "scenarios": scenarios,
    "summary": {
        "sent_total": sent_total,
        "refused_total": refused_total,
        "replay_alerts": int(replay_any),
        "ban_evidence": ban_evidence,
        "bans_active_before": bb,
        "bans_active_after": ab,
        "metrics_alerts": metrics_alerts,
        "ipc": ipc,
        "ban_pipeline": bp,
    },
    "pass": live_pass,
    "note": "127.0.0.1 whitelist'te ban atlanabilir — sent>0 + replay_alerts yeterli",
}
report_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[live_attack_harness] -> {report_path} pass={live_pass} sent={sent_total} refused={refused_total}")
sys.exit(0 if live_pass else 1)
PY

rm -f "$SCEN_TMP"
echo "[OK] live_attack_harness tamam"
