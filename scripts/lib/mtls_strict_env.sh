#!/usr/bin/env bash
# GUARDIAN_API_MTLS_STRICT — /etc/log-guardian/env (log-guardian.service)
#   source scripts/lib/mtls_strict_env.sh
#   mtls_strict_enable | mtls_strict_disable | mtls_strict_status
set -euo pipefail

MTLS_STRICT_ENV="${MTLS_STRICT_ENV:-/etc/log-guardian/env}"

mtls_strict_is_on() {
  [[ -f "$MTLS_STRICT_ENV" ]] && grep -qE '^GUARDIAN_API_MTLS_STRICT=(1|true|yes)' "$MTLS_STRICT_ENV" 2>/dev/null
}

mtls_strict_enable() {
  [[ "$(id -u)" -eq 0 ]] || {
    echo "[mtls_strict] sudo gerekli" >&2
    return 1
  }
  install -d -m 750 /etc/log-guardian
  touch "$MTLS_STRICT_ENV"
  chmod 640 "$MTLS_STRICT_ENV" 2>/dev/null || true
  if grep -qE '^GUARDIAN_API_MTLS_STRICT=' "$MTLS_STRICT_ENV" 2>/dev/null; then
    sed -i 's/^GUARDIAN_API_MTLS_STRICT=.*/GUARDIAN_API_MTLS_STRICT=1/' "$MTLS_STRICT_ENV"
  else
    echo 'GUARDIAN_API_MTLS_STRICT=1' >>"$MTLS_STRICT_ENV"
  fi
  echo "[OK] GUARDIAN_API_MTLS_STRICT=1 -> $MTLS_STRICT_ENV"
}

mtls_strict_disable() {
  [[ "$(id -u)" -eq 0 ]] || {
    echo "[mtls_strict] sudo gerekli" >&2
    return 1
  }
  [[ -f "$MTLS_STRICT_ENV" ]] || return 0
  sed -i '/^GUARDIAN_API_MTLS_STRICT=/d' "$MTLS_STRICT_ENV"
  echo "[OK] GUARDIAN_API_MTLS_STRICT kaldirildi"
}

mtls_strict_restart_guardian() {
  systemctl restart log-guardian log-guardian-daemon 2>/dev/null \
    || systemctl restart log-guardian 2>/dev/null \
    || true
  sleep 2
}

# Yalnizca dogrudan calistirilinca CLI (source edilince exit etme)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "${1:-status}" in
    enable)
      mtls_strict_enable
      mtls_strict_restart_guardian
      ;;
    disable)
      mtls_strict_disable
      mtls_strict_restart_guardian
      ;;
    status)
      if mtls_strict_is_on; then
        echo "strict=on"
        exit 0
      fi
      echo "strict=off"
      ;;
    *)
      echo "Kullanim: bash scripts/lib/mtls_strict_env.sh {enable|disable|status}" >&2
      exit 1
      ;;
  esac
fi
