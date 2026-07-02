#!/usr/bin/env bash
# VM -> host dashboard fleet telemetry (NAT 10.0.2.2 veya bridged LAN)
#   bash scripts/vm_fleet_agent_setup.sh
#   bash scripts/vm_fleet_agent_setup.sh --install-user-service
#   FLEET_HOST_IP=192.168.1.87 bash scripts/vm_fleet_agent_setup.sh   # yalniz bridged/LAN; NAT'ta vermeyin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AGENT_ID="${AGENT_ID:-node-vm-02}"
FLEET_API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
INTERVAL="${INTERVAL:-8}"
INSTALL_SVC=0
[[ "${1:-}" == "--install-user-service" ]] && INSTALL_SVC=1

fail() { echo "[vm_fleet_agent] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

probe_host() {
  local ip="$1"
  curl -sfk --max-time 4 --resolve "localhost:8443:${ip}" \
    "https://localhost:8443/api/tier" >/dev/null 2>&1
}

resolve_host_ip() {
  if [[ -n "${FLEET_HOST_IP:-}" ]]; then
    if [[ "$FLEET_HOST_IP" == *x* ]] || [[ ! "$FLEET_HOST_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      fail "FLEET_HOST_IP gecersiz ($FLEET_HOST_IP) — ornek degil, gercek IP yazin veya NAT icin degiskeni bos birakin (otomatik 10.0.2.2)"
    fi
    if probe_host "$FLEET_HOST_IP"; then
      echo "$FLEET_HOST_IP"
      return
    fi
    fail "FLEET_HOST_IP=$FLEET_HOST_IP erisilemiyor — host'ta: docker compose -f docker-compose.prod.yml up -d · NAT kullaniyorsaniz FLEET_HOST_IP vermeyin (10.0.2.2 otomatik)"
  fi
  if probe_host "10.0.2.2"; then
    echo "10.0.2.2"
    return
  fi
  for ip in 192.168.1.87 192.168.56.1; do
    if probe_host "$ip"; then
      echo "$ip"
      return
    fi
  done
  fail "host :8443 yok — laptop: docker compose -f docker-compose.prod.yml up -d"
}

HOST_IP="$(resolve_host_ip)"
TELEMETRY_URL="https://${HOST_IP}:8443/api/telemetry"
METRICS_URL="${METRICS_URL:-}"
if [[ -z "$METRICS_URL" ]] && curl -sf --max-time 2 http://127.0.0.1:9091/metrics 2>/dev/null \
    | grep -q loganalyzer_lines_total; then
  METRICS_URL="http://127.0.0.1:9091/metrics"
fi
ENV_FILE="$ROOT/.cache/fleet-vm.env"
mkdir -p "$(dirname "$ENV_FILE")"

cat >"$ENV_FILE" <<EOF
# VM fleet agent — systemd EnvironmentFile (export kullanma)
TELEMETRY_URL=${TELEMETRY_URL}
FLEET_API_KEY=${FLEET_API_KEY}
AGENT_ID=${AGENT_ID}
INTERVAL=${INTERVAL}
METRICS_URL=${METRICS_URL}
EOF

echo "=== vm_fleet_agent_setup ==="
echo "  host=${HOST_IP}:8443  agent=${AGENT_ID}"

export TELEMETRY_URL FLEET_API_KEY AGENT_ID INTERVAL METRICS_URL
bash "$ROOT/scripts/fleet_register_node.sh" "$AGENT_ID"
bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --stop 2>/dev/null || true

if [[ "$INSTALL_SVC" -eq 1 ]]; then
  if command -v loginctl &>/dev/null; then
    if ! loginctl show-user "$(id -un)" -p Linger 2>/dev/null | grep -q '=yes'; then
      echo "[vm_fleet_agent] linger aciliyor (reboot sonrasi user systemd)..."
      sudo loginctl enable-linger "$(id -un)" 2>/dev/null || \
        echo "[WARN] linger acilamadi — oturum acikken keepalive calisir"
    fi
  fi
  UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  mkdir -p "$UNIT_DIR"
  cat >"$UNIT_DIR/log-guardian-fleet-keepalive.service" <<EOF
[Unit]
Description=Log Guardian fleet telemetry (VM -> host)
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
  echo "  durum: systemctl --user status log-guardian-fleet-keepalive"
else
  bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg
  echo "  arka plan log: tail -f ${ROOT}/.cache/fleet-keepalive.log"
  echo "  reboot sonrasi otomatik: bash scripts/vm_fleet_agent_setup.sh --install-user-service"
fi

ok "fleet agent -> ${TELEMETRY_URL}"
echo "  env: source ${ENV_FILE}"
echo "  host filo: https://localhost:8443/fleet (Ctrl+Shift+R)"
