#!/usr/bin/env bash
# nginx :80 hazir mi? — LIVE harness icin (VPS/webhook gerekmez)
#   bash scripts/detect_nginx_live.sh && echo LIVE=1
set -euo pipefail

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"

# inline-consult aciksa GET / → 403; yine de nginx ayakta sayilir
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://${HOST}:${PORT}/" 2>/dev/null || echo 000)
if [[ "$code" =~ ^[2345][0-9]{2}$ ]]; then
  exit 0
fi
exit 1
