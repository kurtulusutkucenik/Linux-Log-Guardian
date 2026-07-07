#!/usr/bin/env bash
# Host analyzer -> Docker dashboard telemetri baglantisi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="/etc/log-guardian/rules.conf"
TOKEN="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
AGENT_ID="${AGENT_ID:-node-kurtulus-01}"  # sync_dashboard_data + fleet_push ile ayni
# Host analyzer -> Docker dashboard (127.0.0.1:3000 TLS gerektirmez)
SAAS_URL="${SAAS_URL:-http://127.0.0.1:3000/api/telemetry}"

if [[ $EUID -ne 0 ]]; then
  echo "[fix_fleet] sudo ile calistirin: sudo bash scripts/fix_fleet_telemetry.sh" >&2
  exit 1
fi

if [[ ! -f "$RULES" ]]; then
  echo "[fix_fleet] $RULES bulunamadi — once install.sh calistirin." >&2
  exit 1
fi

echo "[fix_fleet] rules.conf guncelleniyor..."
grep -q '^SAAS_ENABLED=' "$RULES" && sed -i 's/^SAAS_ENABLED=.*/SAAS_ENABLED=1/' "$RULES" || echo 'SAAS_ENABLED=1' >> "$RULES"
grep -q '^SAAS_URL=' "$RULES" && sed -i "s|^SAAS_URL=.*|SAAS_URL=${SAAS_URL}|" "$RULES" || echo "SAAS_URL=${SAAS_URL}" >> "$RULES"
grep -q '^SAAS_TOKEN=' "$RULES" && sed -i "s|^SAAS_TOKEN=.*|SAAS_TOKEN=${TOKEN}|" "$RULES" || echo "SAAS_TOKEN=${TOKEN}" >> "$RULES"
grep -q '^AGENT_ID=' "$RULES" && sed -i "s|^AGENT_ID=.*|AGENT_ID=${AGENT_ID}|" "$RULES" || echo "AGENT_ID=${AGENT_ID}" >> "$RULES"
grep -q '^TENANT_ID=' "$RULES" || echo 'TENANT_ID=default' >> "$RULES"

FLEET_HMAC_KEY="${FLEET_COMMAND_HMAC_KEY:-log-guardian-fleet-command-dev-key}"
if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  FLEET_HMAC_KEY="${FLEET_COMMAND_HMAC_KEY:-$FLEET_HMAC_KEY}"
fi
grep -q '^FLEET_COMMAND_HMAC_KEY=' "$RULES" \
  && sed -i "s|^FLEET_COMMAND_HMAC_KEY=.*|FLEET_COMMAND_HMAC_KEY=${FLEET_HMAC_KEY}|" "$RULES" \
  || echo "FLEET_COMMAND_HMAC_KEY=${FLEET_HMAC_KEY}" >> "$RULES"
grep -q '^FLEET_COMMAND_REQUIRE_SIG=' "$RULES" \
  || echo 'FLEET_COMMAND_REQUIRE_SIG=1' >> "$RULES"

chmod 640 "$RULES"
chown root:log-guardian "$RULES" 2>/dev/null || true

echo "[fix_fleet] log-guardian yeniden baslatiliyor..."
bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --stop 2>/dev/null || true
systemctl restart log-guardian.service
sleep 3

if journalctl -u log-guardian.service -n 8 --no-pager 2>/dev/null | grep -q 'telemetry gönderilemedi'; then
  echo "[fix_fleet] UYARI: Hala telemetry hatasi var." >&2
  echo "  1) Dashboard acik mi? cd \"$ROOT\" && docker compose -f docker-compose.prod.yml up -d dashboard" >&2
  echo "  2) agent_sync yeniden derlendi mi? make -C \"$ROOT\" && sudo make -C \"$ROOT\" install" >&2
  journalctl -u log-guardian.service -n 5 --no-pager >&2 || true
  exit 1
fi

echo "[fix_fleet] OK — ~15 sn icinde https://localhost:8443 filoda ${AGENT_ID} Online olmali."
