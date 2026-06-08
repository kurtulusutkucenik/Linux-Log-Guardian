#!/usr/bin/env bash
# Operatore /etc/log-guardian okuma: log-guardian grubu + dizin izinleri
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[fix_conf_access] sudo gerekli: sudo bash $0 [kullanici]" >&2; exit 1; }

TARGET="${1:-${SUDO_USER:-}}"
if [[ -z "$TARGET" ]]; then
    echo "[fix_conf_access] Kullanim: sudo bash $0 <kullanici>" >&2
    echo "  Ornek: sudo bash $0 kurtulus" >&2
    exit 1
fi

if ! id "$TARGET" >/dev/null 2>&1; then
    echo "[fix_conf_access] Kullanici yok: $TARGET" >&2
    exit 1
fi

CONF_DIR="${LG_CONF:-/etc/log-guardian}"

getent group log-guardian >/dev/null 2>&1 || groupadd --system log-guardian

mkdir -p "$CONF_DIR"
chown root:log-guardian "$CONF_DIR"
chmod 2770 "$CONF_DIR"

if [[ -f "$CONF_DIR/rules.conf" ]]; then
    chown root:log-guardian "$CONF_DIR/rules.conf"
    chmod 640 "$CONF_DIR/rules.conf"
fi
if [[ -f "$CONF_DIR/env" ]]; then
    chown root:log-guardian "$CONF_DIR/env"
    chmod 640 "$CONF_DIR/env"
fi
if [[ -d "$CONF_DIR/rules" ]]; then
    chown -R root:log-guardian "$CONF_DIR/rules"
    chmod 755 "$CONF_DIR/rules"
fi
if [[ -f "$CONF_DIR/events.db" ]]; then
    chown root:log-guardian "$CONF_DIR/events.db"
    chmod 660 "$CONF_DIR/events.db"
fi

if id -nG "$TARGET" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    echo "[fix_conf_access] $TARGET zaten log-guardian grubunda"
else
    usermod -aG log-guardian "$TARGET"
    echo "[fix_conf_access] $TARGET → log-guardian grubu eklendi"
fi

echo "[fix_conf_access] Izinler OK ($CONF_DIR root:log-guardian 750, rules.conf 640)"
echo "[fix_conf_access] Grup aktif olsun diye:"
echo "  newgrp log-guardian"
echo "  veya oturumu kapatip acin"
echo ""
echo "Test (grup aktifken):"
echo "  grep -E 'LOG_PATH|IFACE|METRICS_PORT' $CONF_DIR/rules.conf"
