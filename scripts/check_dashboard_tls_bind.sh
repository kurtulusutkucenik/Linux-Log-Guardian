#!/usr/bin/env bash
# Dashboard TLS portu (:8443) LAN/dis erisim kontrolu (yalnizca okuma)
#   bash scripts/check_dashboard_tls_bind.sh
# Exit 0 = LAN'dan erisilemiyor veya Caddy yok; 1 = LAN acik (internet-facing icin risk)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTTPS_PORT="${HTTPS_PORT:-8443}"
SCRIPTS="$ROOT/scripts"

if ! command -v docker >/dev/null 2>&1 \
    || ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
  echo "[SKIP] check_dashboard_tls_bind — caddy yok"
  exit 0
fi

lan_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
if [[ -z "$lan_ip" || "$lan_ip" == "127.0.0.1" ]]; then
  echo "[OK] Dashboard :${HTTPS_PORT} — tek arayuz (localhost)"
  exit 0
fi

if ! curl -sfk --max-time 2 "https://${lan_ip}:${HTTPS_PORT}/api/tier" >/dev/null 2>&1; then
  echo "[OK] Dashboard :${HTTPS_PORT} LAN'dan kapali ($lan_ip)"
  exit 0
fi

echo "[FAIL] Dashboard :${HTTPS_PORT} LAN'dan erisilebilir ($lan_ip)" >&2
echo "  Oneri: sudo bash scripts/firewall_dashboard_bind.sh install" >&2
echo "  veya: docker-compose.prod.yml ports -> 127.0.0.1:${HTTPS_PORT}:443" >&2
echo "  veya: sudo ufw deny ${HTTPS_PORT}/tcp comment 'log-guardian dashboard'" >&2
if bash "$SCRIPTS/detect_internet_facing.sh" 2>/dev/null; then
  echo "  Internet-facing — laptop_harden.sh veya POST_INSTALL_STRICT=1" >&2
fi
exit 1
