#!/usr/bin/env bash
# Calisan soak test durumu (72h laptop + genel)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PIDFILE="${SOAK_PIDFILE:-$ROOT/.cache/soak-72h.pid}"
LOCK="${SOAK_LOCK_FILE:-$ROOT/.cache/soak-active.lock}"

soak_pid() {
  if [[ -f "$PIDFILE" ]]; then
    local pid
    pid=$(cat "$PIDFILE" 2>/dev/null || true)
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  pgrep -f '[/]scripts/soak_test\.sh' 2>/dev/null | head -1 || true
}

# systemd soak.log; laptop nohup soak-72h.log — en guncel kosuyu sec
pick_soak_log() {
  local pid="${1:-}"
  if [[ -n "$pid" ]] && systemctl is-active log-guardian-soak >/dev/null 2>&1 \
      && [[ -f "$ROOT/soak.log" ]]; then
    echo "$ROOT/soak.log"
    return 0
  fi
  local best="" best_ts=0 f ts epoch
  for f in "$ROOT/soak.log" "$ROOT/soak-72h.log"; do
    [[ -f "$f" ]] || continue
    ts=$(grep '^Baslangic:' "$f" 2>/dev/null | tail -1 | awk '{print $2}' || true)
    [[ -z "$ts" ]] && continue
    epoch=$(date -d "$ts" +%s 2>/dev/null || echo 0)
    if [[ "$epoch" -ge "$best_ts" ]]; then
      best_ts=$epoch
      best=$f
    fi
  done
  if [[ -n "$best" ]]; then
    echo "$best"
  elif [[ -f "$ROOT/soak-72h.log" ]]; then
    echo "$ROOT/soak-72h.log"
  elif [[ -f "$ROOT/soak.log" ]]; then
    echo "$ROOT/soak.log"
  else
    echo "$ROOT/soak-72h.log"
  fi
}

last_run_field() {
  local file="$1" pattern="$2"
  [[ -f "$file" ]] || return 0
  awk -v pat="$pattern" '
    /^=== soak_test ===/ { buf = "" }
    { buf = buf $0 "\n" }
    END {
      n = split(buf, lines, "\n")
      for (i = n; i >= 1; i--) {
        if (lines[i] ~ pat) {
          sub(/^[^:]*: /, "", lines[i])
          print lines[i]
          exit
        }
      }
    }
  ' "$file" 2>/dev/null || true
}

label_from_pid_env() {
  local pid="$1"
  [[ -n "$pid" && -r "/proc/$pid/environ" ]] || return 0
  local env
  env=$(tr '\0' '\n' <"/proc/$pid/environ" 2>/dev/null || true)
  if grep -q '^SOAK_SHORT=1' <<<"$env"; then
    echo "5m"
  elif grep -q '^SOAK_1H=1' <<<"$env"; then
    echo "1h"
  elif grep -q '^SOAK_DURATION=259200' <<<"$env"; then
    echo "72h"
  elif grep -q '^SOAK_DURATION=3600' <<<"$env"; then
    echo "1h"
  fi
}

current_label() {
  local pid="$1" label="" lock_pid=""
  label=$(label_from_pid_env "$pid")
  [[ -n "$label" ]] && { echo "$label"; return 0; }
  if [[ -f "$LOCK" ]]; then
    lock_pid=$(grep '^pid=' "$LOCK" 2>/dev/null | cut -d= -f2 || true)
    if [[ -n "$pid" && "$lock_pid" == "$pid" ]]; then
      label=$(grep '^label=' "$LOCK" 2>/dev/null | cut -d= -f2 || true)
    fi
  fi
  if [[ -z "$label" && -n "${SOAK_LOG:-}" && -f "$SOAK_LOG" ]]; then
    label=$(last_run_field "$SOAK_LOG" '^Mod: ')
    if [[ -z "$label" ]]; then
      local d
      d=$(last_run_field "$SOAK_LOG" '^Sure: ' | awk '{print $1}' | tr -d 's')
      case "$d" in
        3600)   label="1h" ;;
        259200) label="72h" ;;
        300)    label="5m" ;;
      esac
    fi
  fi
  echo "${label:-?}"
}

echo "=== soak_status ==="

SOAK_PID=$(soak_pid)
SOAK_LOG="${SOAK_LOG:-$(pick_soak_log "$SOAK_PID")}"
RUN_LABEL=$(current_label "$SOAK_PID")

if [[ -n "$SOAK_PID" ]]; then
  ELAPSED=$(ps -p "$SOAK_PID" -o etime= 2>/dev/null | tr -d ' ' || echo "?")
  echo "running: PID=$SOAK_PID (elapsed $ELAPSED)  mod=$RUN_LABEL"
  case "$RUN_LABEL" in
    1h)  echo "  -> laptop 1 saatlik kosu (SOAK_1H=1); 72h VPS/VM icin ayri" ;;
    72h) echo "  -> 72 saatlik kosu — laptop icin SOAK_1H=1 onerilir" ;;
    5m)  echo "  -> 5 dk kisa kosu (SOAK_SHORT=1)" ;;
  esac
  echo "log: $SOAK_LOG"
  if [[ -f "$LOCK" ]]; then
    lock_pid=$(grep '^pid=' "$LOCK" 2>/dev/null | cut -d= -f2 || true)
    if [[ -n "$SOAK_PID" && "$lock_pid" == "$SOAK_PID" ]]; then
      grep -E '^label=|^started=' "$LOCK" 2>/dev/null | sed 's/^/  /' || true
    elif [[ -n "$lock_pid" && "$lock_pid" != "$SOAK_PID" ]]; then
      echo "  (eski lock pid=$lock_pid — yoksayiliyor)"
    fi
  fi
else
  echo "stopped"
  [[ -f "$PIDFILE" ]] && echo "  (eski pid dosyasi: $PIDFILE — temizlik: rm -f $PIDFILE)"
fi

if [[ -f soak-report.jsonl ]]; then
  SAMPLES=$(wc -l < soak-report.jsonl | tr -d ' ')
  DUR=""
  INT=""
  RUN_START=""
  LOG_MOD=""
  if [[ -f "$SOAK_LOG" ]]; then
    sure_line=$(last_run_field "$SOAK_LOG" '^Sure: ')
    DUR=$(awk '{print $1}' <<<"$sure_line" | tr -d 's')
    INT=$(awk '{print $3}' <<<"$sure_line" | tr -d 's')
    RUN_START=$(last_run_field "$SOAK_LOG" '^Baslangic: ')
    LOG_MOD=$(last_run_field "$SOAK_LOG" '^Mod: ')
    if [[ -z "$LOG_MOD" && -n "$DUR" ]]; then
      case "$DUR" in
        3600)   LOG_MOD="1h" ;;
        259200) LOG_MOD="72h" ;;
        300)    LOG_MOD="5m" ;;
      esac
    fi
  fi
  [[ -z "$LOG_MOD" ]] && LOG_MOD="$RUN_LABEL"
  [[ "$RUN_LABEL" == "?" && "$LOG_MOD" != "?" ]] && RUN_LABEL="$LOG_MOD"
  [[ -z "$RUN_START" && -f "$LOCK" ]] && \
    RUN_START=$(grep '^started=' "$LOCK" 2>/dev/null | cut -d= -f2- || true)
  if [[ -n "$DUR" && -n "$INT" && "$INT" -gt 0 ]]; then
    EXPECT=$(( (DUR + INT - 1) / INT ))
    echo "samples: $SAMPLES / ~$EXPECT (${INT}s aralik — bu kosu: ${LOG_MOD})"
    if [[ -n "$SOAK_PID" && -n "$RUN_START" ]]; then
      python3 - "$RUN_START" "$DUR" "$INT" "$SAMPLES" <<'PY' 2>/dev/null || true
import sys
from datetime import datetime, timedelta
start_s, dur, interval, samples = sys.argv[1:5]
dur, interval, samples = int(dur), int(interval), int(samples)
try:
    start = datetime.fromisoformat(start_s)
except Exception:
    sys.exit(0)
end = start + timedelta(seconds=dur)
pct = min(100, round(100 * samples * interval / dur, 2))
print(f"  baslangic: {start.strftime('%d %b %Y %H:%M')} (+03)")
print(f"  hedef bitis: {end.strftime('%d %b %Y %H:%M')} (+03)")
print(f"  ilerleme: ~{pct}% ({samples} ornek)")
PY
    fi
  else
    echo "samples: $SAMPLES"
  fi
fi

if [[ -f soak-report.json ]]; then
  python3 - "$SOAK_PID" "$RUN_LABEL" soak-report.json <<'PY' 2>/dev/null || true
import json, sys
running, run_label, path = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    r = json.load(open(path))
except Exception:
    sys.exit(0)
h = r.get("duration_hours") or round(r.get("duration_sec", 0) / 3600, 2)
lbl = r.get("label") or "?"
pop = r.get("pass_operational", r.get("pass"))
strict = r.get("pass_strict", r.get("pass"))
stale = running and (
    (run_label == "1h" and h > 2)
    or (run_label == "5m" and h > 0.5)
    or (lbl != "?" and run_label != "?" and lbl != run_label)
)
prefix = "report (onceki kosu — guncel kosu bitince yenilenir): " if stale else "report: "
print(f"{prefix}{lbl} {h}h strict={strict} operational={pop} "
      f"failures={r.get('failures')}/{r.get('samples')} skips={r.get('skips')} max_rss_kb={r.get('max_rss_kb')}")
PY
fi

if [[ -f "$SOAK_LOG" ]]; then
  echo "--- log (son 5 satir, guncel kosu) ---"
  awk '/^=== soak_test ===/{buf=""} {buf=buf $0 ORS} END{printf "%s", buf}' "$SOAK_LOG" | tail -5
fi
