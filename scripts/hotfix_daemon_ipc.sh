#!/usr/bin/env bash
# Eski daemon binary + IPC gecikmesi → yeni build kur, servisleri yeniden baslat
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[hotfix] sudo gerekli: sudo bash $0" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[hotfix] Derleniyor..."
make -j"$(nproc)" log-guardian log-guardian-daemon

echo "[hotfix] Binary kuruluyor..."
install -m 755 log-guardian log-guardian-daemon /usr/local/bin/

echo "[hotfix] systemd unit + IPC izinleri..."
bash "$ROOT/scripts/repair_daemon_unit.sh"
bash "$ROOT/scripts/fix_ipc_perms.sh"

echo "[hotfix] Servisler yeniden baslatiliyor..."
systemctl restart log-guardian-daemon
sleep 3
systemctl restart log-guardian
sleep 2

if strings /usr/local/bin/log-guardian-daemon | grep -q "IPC accept thread aktif"; then
  echo "[hotfix] Yeni daemon binary OK (IPC accept thread)"
else
  echo "[hotfix] UYARI: hala eski binary gorunuyor" >&2
fi

echo "[hotfix] Health kontrol..."
if timeout 15 log-guardian --health --rules /etc/log-guardian/rules.conf; then
  echo "[hotfix] Tamam — daemon IPC OK"
else
  echo "[hotfix] Health hala FAIL — journal:" >&2
  journalctl -u log-guardian-daemon -n 20 --no-pager >&2 || true
  exit 1
fi
