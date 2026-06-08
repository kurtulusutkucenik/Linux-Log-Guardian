#!/usr/bin/env bash
# log-guardian REST API (:8090) hazir mi? make install sonrasi restart hatirlatir.
#   bash scripts/ensure_guardian_api.sh
#   AUTO_RESTART=1 sudo bash scripts/ensure_guardian_api.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

read_api_port() {
  local f="$1"
  if [[ -f "$f" ]]; then
    local p
    p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
    if [[ -n "$p" && "$p" =~ ^[0-9]+$ ]]; then
      echo "$p"
      return 0
    fi
  fi
  return 1
}

API_PORT="${GUARDIAN_API_PORT:-}"
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port /etc/log-guardian/rules.conf 2>/dev/null || true)
fi
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port "$ROOT/rules.conf" 2>/dev/null || true)
fi
API_PORT="${API_PORT:-8090}"
BASE="http://127.0.0.1:${API_PORT}"

api_ok() {
  curl -sf --max-time 2 "${BASE}/api/v1/metrics" >/dev/null 2>&1
}

wait_api() {
  local tries="${1:-10}"
  local i
  for ((i = 1; i <= tries; i++)); do
    if api_ok; then
      return 0
    fi
    sleep 2
  done
  return 1
}

diagnose() {
  echo "[ensure_guardian_api] tani — port=${API_PORT}"
  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active log-guardian.service 2>/dev/null \
      && echo "  log-guardian.service: active" \
      || echo "  log-guardian.service: inactive"
    systemctl is-active log-guardian-daemon.service 2>/dev/null \
      && echo "  log-guardian-daemon.service: active" \
      || echo "  log-guardian-daemon.service: inactive"
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -tln 2>/dev/null | grep -E ":${API_PORT} |:8080 " || echo "  dinleyen port yok (${API_PORT}/8080)"
  fi
  echo "  cozum: sudo systemctl restart log-guardian-daemon log-guardian"
  echo "  tam onarim: sudo bash scripts/enable_dashboard_ban_api.sh"
}

if api_ok; then
  echo "[OK] Guardian API :${API_PORT}"
  exit 0
fi

if [[ "${AUTO_RESTART:-0}" == "1" && "$(id -u)" -eq 0 ]]; then
  echo "[ensure_guardian_api] servisler yeniden baslatiliyor..."
  systemctl restart log-guardian-daemon.service 2>/dev/null || true
  sleep 2
  systemctl restart log-guardian.service 2>/dev/null || true
  if wait_api 15; then
    echo "[OK] Guardian API :${API_PORT} (restart sonrasi)"
    exit 0
  fi
fi

diagnose
echo "[FAIL] API yanit vermiyor — make install sonrasi mutlaka: sudo systemctl restart log-guardian" >&2
exit 1
