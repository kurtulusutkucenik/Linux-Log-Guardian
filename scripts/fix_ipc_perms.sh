#!/usr/bin/env bash
# /run/log-guardian + ipc.sock → log-guardian grubu (analyzer IPC erisimi)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[fix_ipc_perms] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DAEMON_UNIT=/etc/systemd/system/log-guardian-daemon.service
DROPIN_DIR=/etc/systemd/system/log-guardian-daemon.service.d
DROPIN="$DROPIN_DIR/10-ipc-perms.conf"

# Bozuk unit (ExecStartPost satir ortasinda) → onar
if [[ -f "$DAEMON_UNIT" ]] && grep -A1 '^ExecStart=' "$DAEMON_UNIT" | grep -q '^ExecStartPost='; then
  echo "[fix_ipc_perms] Bozuk daemon unit tespit edildi — onariliyor..."
  bash "$ROOT/scripts/repair_daemon_unit.sh"
fi

G=$(getent group log-guardian | cut -d: -f3 || true)
if [[ -z "$G" ]]; then
  echo "[fix_ipc_perms] log-guardian grubu yok — install.sh calistirin" >&2
  exit 1
fi

if [[ -d /run/log-guardian ]]; then
  chown root:"$G" /run/log-guardian
  chmod 0750 /run/log-guardian
fi
if [[ -S /run/log-guardian/ipc.sock ]]; then
  chown root:"$G" /run/log-guardian/ipc.sock
  chmod 0660 /run/log-guardian/ipc.sock
fi
if [[ -f /run/log-guardian/daemon_stats.json ]]; then
  chown root:"$G" /run/log-guardian/daemon_stats.json
  chmod 0640 /run/log-guardian/daemon_stats.json
fi

mkdir -p "$DROPIN_DIR"
cat > "$DROPIN" <<'EOF'
[Service]
ExecStartPost=+/bin/bash -c 'G=$(getent group log-guardian | cut -d: -f3); [ -n "$G" ] && chown root:$G /run/log-guardian /run/log-guardian/ipc.sock 2>/dev/null; chmod 0750 /run/log-guardian 2>/dev/null; chmod 0660 /run/log-guardian/ipc.sock 2>/dev/null; [ -f /run/log-guardian/daemon_stats.json ] && chown root:$G /run/log-guardian/daemon_stats.json && chmod 0640 /run/log-guardian/daemon_stats.json; true'
EOF
systemctl daemon-reload
echo "[fix_ipc_perms] drop-in guncellendi: $DROPIN"

if [[ -f "$DAEMON_UNIT" ]] && ! grep -q '^RuntimeDirectoryGroup=log-guardian' "$DAEMON_UNIT"; then
  if grep -q '^RuntimeDirectoryMode=' "$DAEMON_UNIT"; then
    sed -i '/^RuntimeDirectoryMode=/a RuntimeDirectoryGroup=log-guardian' "$DAEMON_UNIT"
    systemctl daemon-reload
    echo "[fix_ipc_perms] RuntimeDirectoryGroup eklendi"
  fi
fi

echo "[fix_ipc_perms] OK gid=$G"

INVOKER="${SUDO_USER:-${USER:-}}"
if [[ -n "$INVOKER" && "$INVOKER" != root ]]; then
  if id -nG "$INVOKER" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
    echo "[fix_ipc_perms] $INVOKER zaten log-guardian grubunda"
  elif usermod -aG log-guardian "$INVOKER" 2>/dev/null; then
    echo "[fix_ipc_perms] $INVOKER log-guardian grubuna eklendi — newgrp log-guardian veya oturumu yenileyin"
  fi
fi

if [[ -x "$ROOT/scripts/fix_rules_conf_perms.sh" ]]; then
  bash "$ROOT/scripts/fix_rules_conf_perms.sh" 2>/dev/null || true
fi
