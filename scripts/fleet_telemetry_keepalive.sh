#!/usr/bin/env bash
# Dashboard filo Online tutmak icin periyodik telemetri (SAAS kapali iken)
#   bash scripts/fleet_telemetry_keepalive.sh          # on planda
#   bash scripts/fleet_telemetry_keepalive.sh --bg     # arka plan PID dosyasi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDFILE="${ROOT}/.cache/fleet-keepalive.pid"
INTERVAL="${INTERVAL:-8}"
ENV_FILE="${ROOT}/.cache/fleet-vm.env"
HOST_ENV="${ROOT}/.cache/fleet-host.env"

# systemd veya onceki oturum — fleet env yukle (VM oncelikli, sonra host)
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
elif [[ -f "$HOST_ENV" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$HOST_ENV" && set +a
fi

fleet_bg_env() {
  env \
    INTERVAL="${INTERVAL}" \
    TELEMETRY_URL="${TELEMETRY_URL:-}" \
    FLEET_API_KEY="${FLEET_API_KEY:-}" \
    AGENT_ID="${AGENT_ID:-}" \
    FLEET_TELEMETRY_HOST="${FLEET_TELEMETRY_HOST:-}" \
    FLEET_CURL_RESOLVE="${FLEET_CURL_RESOLVE:-}" \
    METRICS_URL="${METRICS_URL:-}" \
    "$@"
}

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
  fleet_bg_env nohup "$0" >>"${ROOT}/.cache/fleet-keepalive.log" 2>&1 &
  echo $! >"$PIDFILE"
  echo "[keepalive] arka plan PID=$(cat "$PIDFILE") interval=${INTERVAL}s"
  exit 0
fi

echo "[keepalive] basladi interval=${INTERVAL}s (Ctrl+C veya --stop)"
while true; do
  fleet_bg_env bash "$ROOT/scripts/fleet_telemetry_push.sh" || true
  sleep "$INTERVAL"
done
