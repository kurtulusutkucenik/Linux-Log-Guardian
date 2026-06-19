#!/usr/bin/env bash
# Bozuk log-guardian-daemon.service dosyasini onarir + IPC drop-in
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[repair_daemon_unit] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT=/etc/systemd/system/log-guardian-daemon.service
DROPIN_DIR=/etc/systemd/system/log-guardian-daemon.service.d
DROPIN="$DROPIN_DIR/10-ipc-perms.conf"
PREFIX="${LG_PREFIX:-/usr/local}"
CONF_DIR="${LG_CONF:-/etc/log-guardian}"

IFACE="${LG_IFACE:-}"
if [[ -z "$IFACE" ]] && [[ -f "$UNIT" ]]; then
  IFACE=$(grep -oP '(?<=--iface )\S+' "$UNIT" 2>/dev/null | head -1 || true)
fi
IFACE="${IFACE:-wlo1}"

install -d -m 0755 /var/lib/ipset

mkdir -p "$DROPIN_DIR"

cat > "$UNIT" <<EOF
[Unit]
Description=Linux Log Guardian — eBPF/XDP Ayricalikli Daemon
After=network.target
Documentation=https://github.com/kurtulusutkucenik/loganalyzer
StartLimitInterval=60s
StartLimitBurst=5

[Service]
Type=notify
EnvironmentFile=-${CONF_DIR}/env
ExecStart=${PREFIX}/bin/log-guardian-daemon \\
    --iface ${IFACE} \\
    --obj ${CONF_DIR}/xdp_filter.o
WorkingDirectory=${CONF_DIR}
User=root
AmbientCapabilities=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW
CapabilityBoundingSet=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW
NoNewPrivileges=yes
WatchdogSec=60
NotifyAccess=main
LimitNOFILE=65536
LimitMEMLOCK=infinity
RuntimeDirectory=log-guardian
RuntimeDirectoryMode=0750
RuntimeDirectoryGroup=log-guardian
Restart=on-failure
RestartSec=3
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=/sys/fs/bpf /run/log-guardian /var/lib/ipset

[Install]
WantedBy=multi-user.target
EOF

cat > "$DROPIN" <<'EOF'
[Service]
ExecStartPost=+/bin/bash -c 'G=$(getent group log-guardian | cut -d: -f3); [ -n "$G" ] && chown root:$G /run/log-guardian /run/log-guardian/ipc.sock 2>/dev/null; chmod 0750 /run/log-guardian 2>/dev/null; chmod 0660 /run/log-guardian/ipc.sock 2>/dev/null; true'
EOF

systemctl daemon-reload
echo "[repair_daemon_unit] OK iface=${IFACE}"
