#!/usr/bin/env bash
# 72 saat soak — arka planda baslat (dogru PID ile)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
SOAK_DURATION="${SOAK_DURATION:-259200}"
SOAK_INTERVAL="${SOAK_INTERVAL:-300}"
if [[ "${SOAK_SHORT:-0}" == "1" ]]; then
  SOAK_DURATION=300
  SOAK_INTERVAL=30
fi
export SOAK_DURATION SOAK_INTERVAL

if ps -eo args= | grep -q '^bash scripts/soak_test.sh$'; then
  echo "[soak_start] Zaten calisiyor — bash scripts/soak_status.sh" >&2
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active log-guardian log-guardian-daemon >/dev/null 2>&1; then
    echo "[soak_start] systemd inactive — once:" >&2
    echo "  sudo systemctl start log-guardian-daemon log-guardian" >&2
    exit 1
  fi
fi

: > soak.log
nohup bash scripts/soak_test.sh >> soak.log 2>&1 &
SOAK_PID=$!
echo "$SOAK_PID" > soak.pid
sleep 1

if ! kill -0 "$SOAK_PID" 2>/dev/null; then
  echo "[soak_start] FAIL — process hemen cikti, soak.log:" >&2
  tail -20 soak.log >&2 || true
  exit 1
fi

DUR_LABEL="${SOAK_DURATION}s"
[[ "$SOAK_DURATION" -ge 3600 && $((SOAK_DURATION % 3600)) -eq 0 ]] && \
  DUR_LABEL="$((SOAK_DURATION / 3600))h"
echo "[soak_start] soak basladi PID=$SOAK_PID (${DUR_LABEL}, aralik=${SOAK_INTERVAL}s)"
echo "  Bitis (tahmini): $(date -d "@$(($(date +%s) + SOAK_DURATION))" -Iseconds 2>/dev/null || date -Iseconds)"
echo "  Izleme: bash scripts/soak_status.sh"
echo "  Log:    tail -f soak.log"
head -5 soak.log
