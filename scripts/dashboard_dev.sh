#!/usr/bin/env bash
# Dashboard dev — http://localhost:3001 (Docker/TLS yok)
#   bash scripts/dashboard_dev.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${DASHBOARD_DEV_PORT:-3001}"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== dashboard_dev ==="
bash "$ROOT/scripts/sync_dashboard_data.sh"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi

if ! systemctl is-active log-guardian >/dev/null 2>&1; then
  echo "[dashboard_dev] UYARI: log-guardian inactive — sudo systemctl start log-guardian log-guardian-daemon"
fi

free_port() {
  local pids=""
  if command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "${PORT}/tcp" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' || true)"
  fi
  if [[ -z "$pids" ]] && command -v ss >/dev/null 2>&1; then
    pids="$(ss -tlnp "sport = :${PORT}" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u || true)"
  fi
  if [[ -z "$pids" ]] && command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti ":${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
  fi
  if [[ -n "$pids" ]]; then
    echo "[dashboard_dev] port ${PORT} dolu — kapatiliyor: $(echo "$pids" | tr '\n' ' ')"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 1
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
}
free_port

echo ""
echo "[OK] dashboard_dev — baslatiliyor :${PORT}"
echo "  URL:    http://localhost:${PORT}/"
echo "  Login:  http://localhost:${PORT}/login"
echo "  Tests:  http://localhost:${PORT}/tests"
echo "  Giris:  admin / .env DASHBOARD_ADMIN_PASSWORD"
echo ""
cd "$ROOT/dashboard"
exec env DASHBOARD_DEV_PORT="$PORT" npm run dev
