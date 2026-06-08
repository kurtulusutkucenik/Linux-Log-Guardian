#!/usr/bin/env bash
# Calisan soak test durumu
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SOAK_PID=$(ps -eo pid=,args= | awk '$2=="bash" && $3=="scripts/soak_test.sh" {print $1; exit}')
FILE_PID=""
[[ -f soak.pid ]] && FILE_PID=$(cat soak.pid 2>/dev/null || true)

echo "=== soak_status ==="

if [[ -n "$SOAK_PID" ]] && kill -0 "$SOAK_PID" 2>/dev/null; then
  ELAPSED=$(ps -p "$SOAK_PID" -o etime= 2>/dev/null | tr -d ' ' || echo "?")
  echo "running: PID=$SOAK_PID (elapsed $ELAPSED)"
  [[ -n "$FILE_PID" && "$FILE_PID" != "$SOAK_PID" ]] && \
    echo "not: soak.pid=$FILE_PID guncel degil — gercek PID=$SOAK_PID"
else
  echo "stopped"
fi

if [[ -f soak-report.jsonl ]]; then
  SAMPLES=$(wc -l < soak-report.jsonl | tr -d ' ')
  if grep -q '^Sure:' soak.log 2>/dev/null; then
    DUR=$(grep '^Sure:' soak.log | tail -1 | awk '{print $2}' | tr -d 's')
    INT=$(grep '^Sure:' soak.log | tail -1 | sed 's/.*aralik: //;s/s$//')
    EXPECT=$(( (DUR + INT - 1) / INT ))
    echo "samples: $SAMPLES / ~$EXPECT (${DUR}s, ${INT}s aralik)"
  else
    echo "samples: $SAMPLES"
  fi
fi

if [[ -f soak-report.json ]]; then
  python3 -c "
import json
try:
    r=json.load(open('soak-report.json'))
    h=r.get('duration_hours') or round(r.get('duration_sec',0)/3600, 2)
    print(f\"report: {h}h pass={r.get('pass')} failures={r.get('failures')}/{r.get('samples')} max_rss_kb={r.get('max_rss_kb')}\")
except Exception: pass
" 2>/dev/null || true
fi

if [[ -f soak.log ]]; then
  echo "--- soak.log (son 5 satir) ---"
  tail -5 soak.log
fi
