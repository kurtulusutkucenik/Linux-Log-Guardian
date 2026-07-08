#!/usr/bin/env bash
# Enterprise SOAR ban API — split token + Caddy :9443 mTLS + loopback strict
#   sudo bash scripts/enable_enterprise_soar_api.sh
#   NO_STRICT=1 sudo bash scripts/enable_enterprise_soar_api.sh
# Kapat: sudo bash scripts/disable_enterprise_soar_api.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

# shellcheck source=scripts/lib/mtls_strict_env.sh
source "$ROOT/scripts/lib/mtls_strict_env.sh"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

echo "=== enable_enterprise_soar_api ==="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[enable_enterprise_soar_api] sudo gerekli (token + /etc/log-guardian/env)" >&2
  exit 1
fi

# Tek restart hattı — binary zaten split destekliyorsa rebuild atla
SKIP_BINARY_UPGRADE=0
if bash "$ROOT/scripts/api_mutation_token_e2e.sh" >/dev/null 2>&1; then
  SKIP_BINARY_UPGRADE=1
fi

SKIP_BINARY_UPGRADE=$SKIP_BINARY_UPGRADE SKIP_DOCKER_SYNC=1 SKIP_API_MUTATION_E2E=1 \
  bash "$ROOT/scripts/ensure_api_split_tokens.sh"

if [[ "${NO_STRICT:-0}" != "1" ]]; then
  mtls_strict_enable
  echo "[OK] GUARDIAN_API_MTLS_STRICT — harici POST yalnizca loopback/relay"
else
  echo "[SKIP] GUARDIAN_API_MTLS_STRICT (NO_STRICT=1)"
fi

# strict env sonrasi tek restart
mtls_strict_restart_guardian

bash "$ROOT/scripts/caddy_mtls_setup.sh" enable

wait_lg_api_ready 45 || {
  echo "[enable_enterprise_soar_api] FAIL: log-guardian API dinlemiyor" >&2
  exit 1
}
wait_lg_ban_ready 60 || {
  echo "[enable_enterprise_soar_api] FAIL: POST /ban hazir degil (restart sonrasi)" >&2
  exit 1
}

if ! bash "$ROOT/scripts/caddy_api_mtls_e2e.sh"; then
  echo "[FAIL] caddy_api_mtls_e2e" >&2
  exit 1
fi

bash "$ROOT/scripts/sync_dashboard_api_token.sh"

wait_lg_relay_ready 30 || echo "[WARN] relay gecikmeli — smoke devam" >&2
wait_lg_ban_ready 45 || {
  echo "[enable_enterprise_soar_api] FAIL: POST /ban (docker sync sonrasi)" >&2
  exit 1
}

smoke_ok=0
for _try in 1 2 3 4 5; do
  if bash "$ROOT/scripts/dashboard_ban_smoke.sh"; then
    smoke_ok=1
    break
  fi
  echo "[enable_enterprise_soar_api] dashboard_ban_smoke deneme ${_try}/5 — ban ready bekleniyor" >&2
  wait_lg_ban_ready 20 || true
  sleep 2
done
[[ "$smoke_ok" -eq 1 ]] || {
  echo "[enable_enterprise_soar_api] FAIL: dashboard_ban_smoke" >&2
  echo "  Elle: bash scripts/dashboard_ban_smoke.sh" >&2
  exit 1
}

bash "$ROOT/scripts/ban_api_mtls_e2e.sh"

bash "$ROOT/scripts/enterprise_soar_gate.sh" && echo "[OK] enterprise_soar_gate" \
  || echo "[WARN] enterprise_soar_gate" >&2

python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
LG_SYNC_NO_SUDO=1 bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true

echo ""
echo "[OK] enable_enterprise_soar_api"
echo "  SOAR (mTLS): https://localhost:9443/api/v1/ban"
echo "  Dashboard:   https://localhost:8443/bans"
echo "  Test:        bash scripts/caddy_api_mtls_e2e.sh"
echo "  Kapat:       sudo bash scripts/disable_enterprise_soar_api.sh"
