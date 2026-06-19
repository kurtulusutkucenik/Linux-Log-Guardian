#!/usr/bin/env bash
# log-guardian REST API (:8090) hazir mi? make install sonrasi restart hatirlatir.
#   bash scripts/ensure_guardian_api.sh
#   AUTO_RESTART=1 AUTO_FIX=1 sudo bash scripts/ensure_guardian_api.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
KDF='ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504'

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

kdf_valid() {
  [[ -f "$RULES" ]] || return 1
  grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$[0-9]+\$[0-9a-fA-F]+\$[0-9a-fA-F]{64}' "$RULES" 2>/dev/null
}

kdf_missing_in_journal() {
  command -v journalctl >/dev/null 2>&1 || return 1
  journalctl -u log-guardian.service -n 8 --no-pager 2>/dev/null \
    | grep -q 'ACCESS_PASSWORD_KDF tanimli degil'
}

needs_kdf_fix() {
  kdf_valid && return 1
  kdf_missing_in_journal && return 0
  [[ -f "$RULES" ]] && return 0
  return 1
}

fix_kdf() {
  [[ "$(id -u)" -eq 0 ]] || return 1
  [[ -f "$RULES" ]] || return 1
  if kdf_valid; then
    return 0
  fi
  echo "[ensure_guardian_api] ACCESS_PASSWORD_KDF eksik — rules.conf onariliyor..."
  sed -i '/^ACCESS_PASSWORD_KDF=/d' "$RULES" 2>/dev/null || true
  sed -i '/^ACCESS_PASSWORD_HASH=/d' "$RULES" 2>/dev/null || true
  printf '\n%s\n' "$KDF" >> "$RULES"
  chmod 600 "$RULES"
  local envfile=/etc/log-guardian/env
  if [[ -f "$envfile" ]] && ! grep -q '^LOGANALYZER_PASSWORD=' "$envfile" 2>/dev/null; then
    echo 'LOGANALYZER_PASSWORD=DegistirBeni!123' >> "$envfile"
    chmod 600 "$envfile"
  fi
  systemctl reset-failed log-guardian.service 2>/dev/null || true
  echo "[ensure_guardian_api] KDF eklendi (varsayilan parola: DegistirBeni!123)"
}

restart_services() {
  [[ "$(id -u)" -eq 0 ]] || return 1
  echo "[ensure_guardian_api] servisler yeniden baslatiliyor..."
  systemctl restart log-guardian-daemon.service 2>/dev/null || true
  sleep 2
  systemctl restart log-guardian.service 2>/dev/null || true
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
  if needs_kdf_fix; then
    echo "  ACCESS_PASSWORD_KDF: eksik veya gecersiz (servis hemen coker)"
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -tln 2>/dev/null | grep -E ":${API_PORT} |:8080 " || echo "  dinleyen port yok (${API_PORT}/8080)"
  fi
  echo "  cozum: sudo bash scripts/fix_analyzer.sh"
  echo "  alternatif: sudo bash scripts/enable_dashboard_ban_api.sh"
}

if api_ok; then
  echo "[OK] Guardian API :${API_PORT}"
  exit 0
fi

auto_fix_enabled() {
  [[ "${AUTO_FIX:-${AUTO_RESTART:-0}}" == "1" ]]
}

try_recover() {
  if [[ "$(id -u)" -ne 0 ]]; then
    return 1
  fi
  if auto_fix_enabled && needs_kdf_fix; then
    fix_kdf || true
  fi
  if [[ "${AUTO_RESTART:-0}" == "1" ]]; then
    restart_services
    if wait_api 15; then
      echo "[OK] Guardian API :${API_PORT} (restart sonrasi)"
      return 0
    fi
  fi
  return 1
}

if try_recover; then
  exit 0
fi

if auto_fix_enabled && [[ "$(id -u)" -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
  echo "[ensure_guardian_api] root onarim deneniyor (fix_analyzer)..."
  if sudo bash "$ROOT/scripts/fix_analyzer.sh"; then
    if wait_api 15; then
      echo "[OK] Guardian API :${API_PORT} (fix_analyzer sonrasi)"
      exit 0
    fi
  fi
fi

diagnose
echo "[FAIL] API yanit vermiyor — sudo bash scripts/fix_analyzer.sh" >&2
exit 1
