#!/usr/bin/env bash
# Dashboard aninda ban API — /etc/log-guardian/rules.conf + servis + IPC
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[enable_dashboard_ban_api] sudo gerekli" >&2
  exit 1
fi

ensure_kv() {
  local key="$1" val="$2" file="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

if [[ ! -f "$CONF" ]]; then
  echo "[enable_dashboard_ban_api] $CONF yok — once: sudo bash scripts/install_steps.sh 3-install" >&2
  exit 1
fi

ensure_kv "API_PORT" "8090" "$CONF"
ensure_kv "API_BIND" "127.0.0.1" "$CONF"
if ! grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null; then
  echo "API_TOKEN=$(openssl rand -hex 32)" >> "$CONF"
fi
API_TOK=$(grep -E '^API_TOKEN=' "$CONF" | tail -1 | cut -d= -f2-)

echo "[1] Binary kurulumu..."
make -C "$ROOT" -s install

echo "[2] IPC + unit onarimi..."
bash "$ROOT/scripts/repair_daemon_unit.sh"
systemctl restart log-guardian-daemon.service
sleep 2
bash "$ROOT/scripts/fix_ipc_perms.sh"
bash "$ROOT/scripts/repair_analyzer_unit.sh"
bash "$ROOT/scripts/fix_ipc_perms.sh"

echo "[3] Daemon + analyzer..."
systemctl restart log-guardian-daemon.service
sleep 2
bash "$ROOT/scripts/fix_ipc_perms.sh"
systemctl restart log-guardian.service
sleep 2
bash "$ROOT/scripts/fix_ipc_perms.sh"

echo "[4] IPC erisim testi (gercek connect)..."
for _ in 1 2 3 4 5 6; do
  if systemctl is-active --quiet log-guardian-daemon.service && \
     [[ -S /run/log-guardian/ipc.sock ]]; then
    break
  fi
  sleep 2
done
if ! systemctl is-active --quiet log-guardian-daemon.service; then
  echo "[FAIL] log-guardian-daemon calismiyor (watchdog?)" >&2
  journalctl -u log-guardian-daemon.service -n 8 --no-pager >&2 || true
  exit 1
fi
if ! bash "$ROOT/scripts/test_ipc_connect.sh"; then
  echo "[FAIL] log-guardian kullanicisi ipc.sock'a baglanamiyor" >&2
  ls -la /run/log-guardian/ 2>&1 || true
  exit 1
fi
echo "[OK] IPC soketi erisilebilir"

if ! ss -tln | grep -q ':8090 '; then
  echo "[FAIL] 8090 dinlemiyor" >&2
  journalctl -u log-guardian.service -n 12 --no-pager | grep -E 'API|8090|bind' || true
  exit 1
fi

echo "[5] Ban API testi..."
out=$(curl -s -X POST -H "Authorization: Bearer ${API_TOK}" \
  "http://127.0.0.1:8090/api/v1/ban?ip=203.0.113.55&reason=dashboard-setup-test")
echo "$out"
echo "$out" | grep -q '"success":true' || { echo "[FAIL] ban API" >&2; exit 1; }

echo "[6] Ban listesi..."
bans_out=$(curl -s "http://127.0.0.1:8090/api/v1/bans")
echo "$bans_out"
echo "$bans_out" | grep -q '"ips"' || { echo "[FAIL] bans list API" >&2; exit 1; }

curl -s -X POST -H "Authorization: Bearer ${API_TOK}" \
  "http://127.0.0.1:8090/api/v1/unban?ip=203.0.113.55&reason=setup-cleanup" >/dev/null || true

echo "[7] Ban API relay (18090) + smoke..."
docker compose -f "$ROOT/docker-compose.prod.yml" up -d host-api-bridge metrics-relay ban-api-relay 2>/dev/null || true
sleep 1
if bash "$ROOT/scripts/dashboard_ban_smoke.sh"; then
  bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
else
  echo "[WARN] dashboard_ban_smoke FAIL — relay veya token kontrol edin" >&2
fi

echo ""
echo "[OK] Dashboard ban API hazir."
echo "  Giriş: https://localhost:8443  admin / (.env DASHBOARD_ADMIN_PASSWORD veya ChangeMeOnFirstLogin!)"
echo "  Docker: export GUARDIAN_API_TOKEN=\$(grep '^API_TOKEN=' $CONF | cut -d= -f2-)"
echo "          cd \"$ROOT\" && docker compose -f docker-compose.prod.yml up -d host-api-bridge ban-api-relay dashboard"
echo "          (ban/unban relay: ban-api-relay:18090 -> host-api-bridge:18091 -> 127.0.0.1:8090)"
