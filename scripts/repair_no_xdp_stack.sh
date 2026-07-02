#!/usr/bin/env bash
# --no-xdp / iptables kurulum sonrasi tek komut onarim:
#   daemon unit yok + log-guardian Requires=daemon + fleet log gurultusu
#   sudo bash scripts/repair_no_xdp_stack.sh
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[repair_no_xdp_stack] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
RUN_USER="${SUDO_USER:-}"
QUIET="${REPAIR_QUIET:-0}"

run_step() {
  if [[ "$QUIET" == "1" ]]; then
    "$@" >/dev/null 2>&1 || "$@"
  else
    "$@"
  fi
}

IFACE="${LG_IFACE:-}"
if [[ -z "$IFACE" && -f "$RULES" ]]; then
  IFACE=$(grep -oP '^IFACE=\K.*' "$RULES" 2>/dev/null | tr -d ' "' || true)
fi
IFACE="${IFACE:-eth0}"

echo "[repair_no_xdp_stack] iface=$IFACE"

install -d -m 0755 /var/lib/ipset
install -d -m 0755 /var/log/nginx
touch /var/log/nginx/access.log 2>/dev/null || true
chmod 644 /var/log/nginx/access.log 2>/dev/null || true
chgrp adm /var/log/nginx/access.log 2>/dev/null || true

bash "$ROOT/scripts/fix_ipc_perms.sh"
if [[ -x "$ROOT/scripts/vm_install_runtime_deps.sh" ]]; then
  bash "$ROOT/scripts/vm_install_runtime_deps.sh"
fi
run_step bash "$ROOT/scripts/sync_service_password.sh"
run_step bash "$ROOT/scripts/fix_rules_conf_perms.sh"
run_step bash "$ROOT/scripts/ensure_daemon_env.sh"
run_step bash "$ROOT/scripts/ensure_api_security.sh"

LG_IFACE="$IFACE" run_step bash "$ROOT/scripts/repair_daemon_unit.sh"

# etcd / fleet telemetry — dashboard yoksa journal gurultusu
lg_rules_sed() {
  local key="$1" val="$2"
  [[ -f "$RULES" ]] || return 0
  if grep -q "^${key}=" "$RULES" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$RULES"
  else
    echo "${key}=${val}" >> "$RULES"
  fi
}
lg_rules_sed MESH_BACKEND none
lg_rules_sed MESH_ETCD_ENDPOINTS ""
lg_rules_sed SAAS_ENABLED 0
echo "[OK] fleet mesh kapali (MESH_BACKEND=none SAAS_ENABLED=0)"
echo "[INFO] Dashboard filo icin sonra: sudo bash scripts/fix_fleet_telemetry.sh"
echo "       host reboot-safe: bash scripts/host_fleet_agent_setup.sh --install-user-service"

systemctl daemon-reload
systemctl enable log-guardian-daemon.service log-guardian.service 2>/dev/null || true
systemctl restart log-guardian-daemon.service 2>/dev/null || true
sleep 2
systemctl restart log-guardian.service 2>/dev/null || true
sleep 5

METRICS_PORT=9091
if [[ -f "$RULES" ]]; then
  mp=$(grep -E '^METRICS_PORT=' "$RULES" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  [[ -n "$mp" && "$mp" != "0" ]] && METRICS_PORT="$mp"
fi
METRICS_WAIT="${LG_METRICS_WAIT_SEC:-90}"
echo "[repair_no_xdp_stack] metrics bekleniyor (:${METRICS_PORT}, max ${METRICS_WAIT}s — WASM cold start)..."
metrics_ok=0
for _ in $(seq 1 "$METRICS_WAIT"); do
  body=$(curl -sf --connect-timeout 2 --max-time 3 \
    "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null || true)
  if [[ -n "$body" ]] && grep -qE 'loganalyzer_(lines_total|eps|alerts_total|webhook_sent_total)' <<<"$body"; then
    metrics_ok=1
    break
  fi
  sleep 1
done
if [[ "$metrics_ok" -eq 1 ]]; then
  echo "[OK] metrics :${METRICS_PORT}"
else
  echo "[WARN] metrics :${METRICS_PORT} henuz yok — journalctl -u log-guardian -n 30" >&2
  if systemctl is-active log-guardian.service >/dev/null 2>&1 \
      && journalctl -u log-guardian -n 40 --no-pager 2>/dev/null \
        | grep -q '\[METRICS\] Prometheus endpoint'; then
    echo "[INFO] journal METRICS satiri var — 15s sonra tekrar deneniyor..." >&2
    sleep 15
    body=$(curl -sf --connect-timeout 2 --max-time 3 \
      "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null || true)
    if [[ -n "$body" ]] && grep -qE 'loganalyzer_' <<<"$body"; then
      metrics_ok=1
      echo "[OK] metrics :${METRICS_PORT} (gecikmeli)"
    fi
  fi
fi

if [[ -n "$RUN_USER" && "$RUN_USER" != "root" ]]; then
  if ! id -nG "$RUN_USER" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    usermod -aG log-guardian "$RUN_USER" 2>/dev/null || true
    echo "[OK] $RUN_USER → log-guardian grubu (newgrp veya yeni shell)"
  fi
fi

analyzer_ok=0
daemon_ok=0
systemctl is-active log-guardian.service >/dev/null 2>&1 && analyzer_ok=1
systemctl is-active log-guardian-daemon.service >/dev/null 2>&1 && daemon_ok=1

if [[ "$analyzer_ok" -eq 1 ]]; then
  echo "[OK] log-guardian.service active"
else
  echo "[FAIL] log-guardian.service inactive — journalctl -u log-guardian -n 25" >&2
  exit 1
fi

if [[ "$daemon_ok" -eq 1 ]]; then
  echo "[OK] log-guardian-daemon.service active"
else
  echo "[WARN] log-guardian-daemon inactive (VM/Wi-Fi no-xdp — analyzer+ipset yeterli)" >&2
fi

if [[ "$metrics_ok" -ne 1 ]]; then
  echo "[FAIL] metrics :${METRICS_PORT} yok — analyzer ayakta degil veya baslamadi" >&2
  echo "  journalctl -u log-guardian -n 25 --no-pager" >&2
  journalctl -u log-guardian -n 15 --no-pager 2>/dev/null | sed 's/^/    /' >&2 || true
  if [[ -x "$ROOT/scripts/vm_install_runtime_deps.sh" ]]; then
    echo "  sudo bash scripts/vm_install_runtime_deps.sh && sudo bash scripts/repair_no_xdp_stack.sh" >&2
  fi
  exit 1
fi

echo ""
if [[ "$QUIET" == "1" ]]; then
  echo "Sonraki: bash scripts/vm_demo_gate.sh --verify-only"
else
  echo "Sonraki (normal kullanici):"
  echo "  newgrp log-guardian"
  echo "  bash scripts/post_install_verify.sh"
  echo "  SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start"
fi
