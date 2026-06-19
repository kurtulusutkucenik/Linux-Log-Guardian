#!/usr/bin/env bash
# --no-xdp / iptables kurulum sonrasi tek komut onarim:
#   daemon unit yok + log-guardian Requires=daemon + fleet log gurultusu
#   sudo bash scripts/repair_no_xdp_stack.sh
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[repair_no_xdp_stack] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
RUN_USER="${SUDO_USER:-}"

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
bash "$ROOT/scripts/sync_service_password.sh"
bash "$ROOT/scripts/fix_rules_conf_perms.sh"
bash "$ROOT/scripts/ensure_api_security.sh"

LG_IFACE="$IFACE" bash "$ROOT/scripts/repair_daemon_unit.sh"

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

systemctl daemon-reload
systemctl enable log-guardian-daemon.service log-guardian.service 2>/dev/null || true
systemctl restart log-guardian-daemon.service 2>/dev/null || true
sleep 2
systemctl restart log-guardian.service 2>/dev/null || true

if [[ -n "$RUN_USER" && "$RUN_USER" != "root" ]]; then
  if ! id -nG "$RUN_USER" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    usermod -aG log-guardian "$RUN_USER" 2>/dev/null || true
    echo "[OK] $RUN_USER → log-guardian grubu (newgrp veya yeni shell)"
  fi
fi

if systemctl is-active log-guardian-daemon log-guardian >/dev/null 2>&1; then
  echo "[OK] servisler active"
else
  echo "[WARN] servis inactive — journalctl -u log-guardian-daemon -n 20" >&2
  exit 1
fi

echo ""
echo "Sonraki (normal kullanici):"
echo "  newgrp log-guardian"
echo "  bash scripts/post_install_verify.sh"
echo "  SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start"
