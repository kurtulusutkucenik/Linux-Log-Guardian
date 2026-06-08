#!/usr/bin/env bash
# systemd unit uyumluluk onarimi — StartLimit [Unit] bolumune tasindi
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[repair_systemd_units] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${LG_PREFIX:-/usr/local}"
CONF_DIR="${LG_CONF:-/etc/log-guardian}"
IFACE="${LG_IFACE:-}"

if [[ -z "$IFACE" && -f /etc/systemd/system/log-guardian-daemon.service ]]; then
  IFACE=$(grep -oP '(?<=--iface )\S+' /etc/systemd/system/log-guardian-daemon.service 2>/dev/null | head -1 || true)
fi
IFACE="${IFACE:-wlo1}"

NGINX_LOG="${LG_NGINX_LOG:-}"
if [[ -z "$NGINX_LOG" && -f "$CONF_DIR/rules.conf" ]]; then
  NGINX_LOG=$(grep -oP '^LOG_PATH=\K.*' "$CONF_DIR/rules.conf" 2>/dev/null | tr -d ' "' || true)
fi
NGINX_LOG="${NGINX_LOG:-/var/log/nginx/access.log}"

echo "[repair_systemd_units] iface=$IFACE log=$NGINX_LOG"

bash "$ROOT/scripts/repair_daemon_unit.sh"

cat > /etc/systemd/system/log-guardian.service <<EOF
[Unit]
Description=Linux Log Guardian — L7 Analiz & WAF Motoru
After=network.target log-guardian-daemon.service
Requires=log-guardian-daemon.service
Documentation=https://github.com/kurtulusutkucenik/loganalyzer
StartLimitInterval=60s
StartLimitBurst=5

[Service]
Type=simple
EnvironmentFile=-${CONF_DIR}/env
Environment=LD_LIBRARY_PATH=${PREFIX}/lib/log-guardian
ExecStart=${PREFIX}/bin/log-guardian ${NGINX_LOG} \\
    --rules ${CONF_DIR}/rules.conf \\
    --db ${CONF_DIR}/events.db \\
    --follow --no-tui
User=log-guardian
Group=log-guardian
SupplementaryGroups=adm
NoNewPrivileges=yes
WatchdogSec=30
LimitNOFILE=65536
Restart=on-failure
RestartSec=3
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=${CONF_DIR} /var/log/nginx

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "[OK] repair_systemd_units — systemctl restart log-guardian-daemon log-guardian"
