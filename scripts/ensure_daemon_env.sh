#!/usr/bin/env bash
# Laptop no-xdp: io_uring watchdog/IPC crash onleme — /etc/log-guardian/env
#   sudo bash scripts/ensure_daemon_env.sh
#   LG_DISABLE_URING=0 sudo bash scripts/ensure_daemon_env.sh   # io_uring acik birak
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[ensure_daemon_env] sudo gerekli" >&2; exit 1; }

CONF_DIR="${LG_CONF:-/etc/log-guardian}"
ENV="$CONF_DIR/env"
mkdir -p "$CONF_DIR"
touch "$ENV"
chmod 640 "$ENV"

set_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV"
  else
    echo "${key}=${val}" >> "$ENV"
  fi
}

if [[ "${LG_DISABLE_URING:-1}" != "0" ]]; then
  set_kv LG_DISABLE_URING 1
  echo "[ensure_daemon_env] LG_DISABLE_URING=1 -> $ENV"
else
  set_kv LG_DISABLE_URING 0
  echo "[ensure_daemon_env] LG_DISABLE_URING=0 -> $ENV (io_uring acik)"
fi
