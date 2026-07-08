#!/usr/bin/env bash
# Operator gate — dashboard login (:3000 oncelik, rate-limit kilidi onleme)
#   source scripts/lib/dashboard_gate_auth.sh
#   dashboard_gate_login "$COOKIE_JAR" || exit 1
set -euo pipefail

dashboard_gate_admin_pass() {
  local p="${DASHBOARD_ADMIN_PASSWORD:-}"
  if [[ -z "$p" && -f "${ROOT:-.}/.env" ]]; then
    # shellcheck disable=SC1090
    set -a && source "${ROOT}/.env" && set +a
    p="${DASHBOARD_ADMIN_PASSWORD:-}"
  fi
  echo "${p:-DegistirBeni!123}"
}

dashboard_gate_base_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return 0
  fi
  if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
    return 0
  fi
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
    return 0
  fi
  echo "http://127.0.0.1:3000"
}

dashboard_gate_curl_opts() {
  local url="$1"
  DASH_GATE_TLS=()
  DASH_GATE_RESOLVE=()
  if [[ "$url" == https://* ]]; then
    DASH_GATE_TLS=(-k)
  fi
  if [[ "$url" == https://localhost:* ]]; then
    local port="${url#https://localhost:}"
    port="${port%%/*}"
    DASH_GATE_RESOLVE=(--resolve "localhost:${port}:127.0.0.1")
  fi
}

dashboard_gate_curl() {
  local url="$1"
  shift
  dashboard_gate_curl_opts "$url"
  curl "${DASH_GATE_TLS[@]}" "${DASH_GATE_RESOLVE[@]}" "$@"
}

# Operator scriptleri — loopback XFF (yalnizca :3000 / yerel erisim)
dashboard_gate_login() {
  local jar="$1"
  local url user pass code
  url="$(dashboard_gate_base_url)"
  user="${DASHBOARD_GATE_USER:-admin}"
  pass="$(dashboard_gate_admin_pass)"
  code=$(dashboard_gate_curl "$url" -s -o /dev/null -w '%{http_code}' -c "$jar" \
    -X POST "${url}/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 127.0.0.1" \
    -d "{\"username\":\"${user}\",\"password\":\"${pass}\"}" 2>/dev/null || echo 000)
  [[ "$code" == "200" ]] && return 0
  echo "[dashboard_gate_auth] login HTTP $code (url=$url)" >&2
  return 1
}
