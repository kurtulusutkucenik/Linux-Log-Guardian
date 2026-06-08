#!/usr/bin/env bash
# nginx :80 hazir mi? — LIVE harness icin (VPS/webhook gerekmez)
#   bash scripts/detect_nginx_live.sh && echo LIVE=1
set -euo pipefail

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"

if curl -sf --max-time 3 "http://${HOST}:${PORT}/" -o /dev/null 2>/dev/null; then
  exit 0
fi
exit 1
