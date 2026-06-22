#!/usr/bin/env bash
# Dashboard filo Online tutmak icin periyodik telemetri (SAAS kapali iken)
#   bash scripts/fleet_telemetry_keepalive.sh          # on planda
#   bash scripts/fleet_telemetry_keepalive.sh --bg     # arka plan PID dosyasi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDFILE="${ROOT}/.cache/fleet-keepalive.pid"
INTERVAL="${INTERVAL:-8}"

if [[ "${1:-}" == "--stop" ]]; then
  if [[ -f "$PIDFILE" ]]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null && rm -f "$PIDFILE" && echo "[keepalive] durduruldu"
  else
    echo "[keepalive] calismiyor"
  fi
  exit 0
fi

if [[ "${1:-}" == "--bg" ]]; then
  mkdir -p "$(dirname "$PIDFILE")"
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "[keepalive] zaten calisiyor PID=$(cat "$PIDFILE")"
    exit 0
  fi
  nohup env INTERVAL="$INTERVAL" "$0" >>"${ROOT}/.cache/fleet-keepalive.log" 2>&1 &
  echo $! >"$PIDFILE"
  echo "[keepalive] arka plan PID=$(cat "$PIDFILE") interval=${INTERVAL}s"
  exit 0
fi

echo "[keepalive] basladi interval=${INTERVAL}s (Ctrl+C veya --stop)"
while true; do
  bash "$ROOT/scripts/fleet_telemetry_push.sh" || true
  sleep "$INTERVAL"
done
