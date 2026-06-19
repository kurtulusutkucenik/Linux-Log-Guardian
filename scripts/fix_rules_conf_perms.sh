#!/usr/bin/env bash
# rules.conf → root:log-guardian 640 (servis User=log-guardian okuyabilsin)
#   sudo bash scripts/fix_rules_conf_perms.sh
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "[fix_rules_conf_perms] sudo gerekli" >&2; exit 1; }

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
DIR="${LG_CONF:-/etc/log-guardian}"

getent group log-guardian >/dev/null 2>&1 || {
  echo "[fix_rules_conf_perms] log-guardian grubu yok" >&2
  exit 1
}

if [[ -d "$DIR" ]]; then
  chown root:log-guardian "$DIR"
  chmod 750 "$DIR"
fi

if [[ -f "$CONF" ]]; then
  chown root:log-guardian "$CONF"
  chmod 640 "$CONF"
  echo "[fix_rules_conf_perms] OK $CONF (640 root:log-guardian)"
fi

if [[ -f "$DIR/events.db" ]]; then
  chown root:log-guardian "$DIR/events.db" 2>/dev/null || true
  chmod 660 "$DIR/events.db" 2>/dev/null || true
fi

if [[ -d "$DIR/data" ]]; then
  chown root:log-guardian "$DIR/data" 2>/dev/null || true
  chmod 2770 "$DIR/data" 2>/dev/null || true
fi
