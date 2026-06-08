#!/usr/bin/env bash
# Analyzer unit — /run/log-guardian ReadWritePaths kaldir (IPC soketi gizlenmesin)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[repair_analyzer_unit] sudo gerekli" >&2; exit 1; }

UNIT=/etc/systemd/system/log-guardian.service

if [[ ! -f "$UNIT" ]]; then
  echo "[repair_analyzer_unit] $UNIT yok" >&2
  exit 1
fi

if grep -q '/run/log-guardian' "$UNIT"; then
  sed -i 's|ReadWritePaths=\(.*\) /run/log-guardian|ReadWritePaths=\1|' "$UNIT"
  sed -i 's| /run/log-guardian||g' "$UNIT"
  sed -i 's|ReadWritePaths=$||' "$UNIT"
  systemctl daemon-reload
  echo "[repair_analyzer_unit] ReadWritePaths duzeltildi (IPC icin /run paylasimli)"
else
  echo "[repair_analyzer_unit] zaten OK"
fi

systemctl restart log-guardian.service
sleep 2
echo "[repair_analyzer_unit] log-guardian restarted"
