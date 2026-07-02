#!/usr/bin/env bash
# Host laptop -> dashboard :8443 fleet telemetry (node-kurtulus-01)
#   bash scripts/host_fleet_agent_setup.sh
#   bash scripts/host_fleet_agent_setup.sh --install-user-service
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AGENT_ID="${AGENT_ID:-node-kurtulus-01}"
FLEET_API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
INTERVAL="${INTERVAL:-8}"
INSTALL_SVC=0
[[ "${1:-}" == "--install-user-service" ]] && INSTALL_SVC=1

fail() { echo "[host_fleet_agent] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

TELEMETRY_URL="${TELEMETRY_URL:-https://localhost:8443/api/telemetry}"
METRICS_URL="${METRICS_URL:-http://127.0.0.1:9091/metrics}"

if ! curl -sfk --max-time 4 "https://localhost:8443/api/tier" >/dev/null 2>&1; then
  fail "host :8443 yok — docker compose -f docker-compose.prod.yml up -d"
fi

ENV_FILE="$ROOT/.cache/fleet-host.env"
mkdir -p "$(dirname "$ENV_FILE")"

cat >"$ENV_FILE" <<EOF
# Host fleet agent — systemd EnvironmentFile (export kullanma)
TELEMETRY_URL=${TELEMETRY_URL}
FLEET_API_KEY=${FLEET_API_KEY}
AGENT_ID=${AGENT_ID}
INTERVAL=${INTERVAL}
METRICS_URL=${METRICS_URL}
EOF

echo "=== host_fleet_agent_setup ==="
echo "  telemetry=${TELEMETRY_URL}  agent=${AGENT_ID}"

export TELEMETRY_URL FLEET_API_KEY AGENT_ID INTERVAL METRICS_URL
bash "$ROOT/scripts/fleet_register_node.sh" "$AGENT_ID"
bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --stop 2>/dev/null || true

if [[ "$INSTALL_SVC" -eq 1 ]]; then
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "[host_fleet_agent] root oturumu — user systemd atlandi; nohup keepalive" >&2
    bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg
    ok "fleet keepalive (nohup — user icin: bash scripts/host_fleet_agent_setup.sh --install-user-service)"
    exit 0
  fi
  if [[ -z "${XDG_RUNTIME_DIR:-}" ]] || ! systemctl --user show-environment &>/dev/null; then
    echo "[host_fleet_agent] user systemd bus yok — nohup keepalive" >&2
    bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg
    ok "fleet keepalive (nohup)"
    echo "  reboot sonrasi: bash scripts/host_fleet_agent_setup.sh --install-user-service"
    exit 0
  fi
  if command -v loginctl &>/dev/null; then
    if ! loginctl show-user "$(id -un)" -p Linger 2>/dev/null | grep -q '=yes'; then
      echo "[host_fleet_agent] linger aciliyor (reboot sonrasi user systemd)..."
      sudo loginctl enable-linger "$(id -un)" 2>/dev/null || \
        echo "[WARN] linger acilamadi — oturum acikken keepalive calisir"
    fi
  fi
  UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  mkdir -p "$UNIT_DIR"
  cat >"$UNIT_DIR/log-guardian-fleet-keepalive.service" <<EOF
[Unit]
Description=Log Guardian fleet telemetry (host -> dashboard)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${ROOT}
EnvironmentFile=${ENV_FILE}
ExecStart=/bin/bash "${ROOT}/scripts/fleet_telemetry_keepalive.sh"
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable log-guardian-fleet-keepalive.service
  systemctl --user restart log-guardian-fleet-keepalive.service
  sleep 2
  ok "user systemd: log-guardian-fleet-keepalive.service"
  systemctl --user --no-pager status log-guardian-fleet-keepalive.service || true
  echo "  log: journalctl --user -u log-guardian-fleet-keepalive -f"
else
  bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg
  echo "  arka plan log: tail -f ${ROOT}/.cache/fleet-keepalive.log"
  echo "  reboot sonrasi otomatik: bash scripts/host_fleet_agent_setup.sh --install-user-service"
fi

ok "fleet agent -> ${TELEMETRY_URL}"
echo "  env: ${ENV_FILE}"
echo "  filo: https://localhost:8443/fleet (Ctrl+Shift+R)"
