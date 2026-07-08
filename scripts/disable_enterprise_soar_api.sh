#!/usr/bin/env bash
# Enterprise SOAR ban API kapat — Caddy mTLS + strict loopback
#   sudo bash scripts/disable_enterprise_soar_api.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib/mtls_strict_env.sh
source "$ROOT/scripts/lib/mtls_strict_env.sh"

echo "=== disable_enterprise_soar_api ==="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[disable_enterprise_soar_api] sudo gerekli" >&2
  exit 1
fi

bash "$ROOT/scripts/caddy_mtls_setup.sh" disable

if [[ "${KEEP_STRICT:-0}" != "1" ]]; then
  mtls_strict_disable
  mtls_strict_restart_guardian
else
  echo "[SKIP] GUARDIAN_API_MTLS_STRICT korundu (KEEP_STRICT=1)"
fi

bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
bash "$ROOT/scripts/ban_api_mtls_e2e.sh" 2>/dev/null || true
LG_SYNC_NO_SUDO=1 bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true

echo "[OK] disable_enterprise_soar_api — SOAR :9443 kapali, dashboard :8443 ayni"
