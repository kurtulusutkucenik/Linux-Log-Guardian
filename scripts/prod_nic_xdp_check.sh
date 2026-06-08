#!/usr/bin/env bash
# Prod NIC + XDP / ipset-fallback durumu
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[prod_nic_xdp] FAIL: $*" >&2; exit 1; }
warn() { echo "[prod_nic_xdp] WARN: $*" >&2; }

LG="${LG_BIN:-}"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
[[ -z "$LG" && -x ./log-guardian ]] && LG=./log-guardian
[[ -x "$LG" ]] || fail "log-guardian binary yok"

echo "=== prod_nic_xdp_check ==="

DEFAULT_IF=$(ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev"){print $(i+1); exit}}')
DEFAULT_IF="${DEFAULT_IF:-?}"
echo "varsayilan rota NIC: $DEFAULT_IF"

IFACE_CFG=""
if [[ -f /etc/log-guardian/rules.conf ]]; then
  IFACE_CFG=$(grep -m1 '^IFACE=' /etc/log-guardian/rules.conf | cut -d= -f2- || true)
fi
echo "rules.conf IFACE: ${IFACE_CFG:-?}"

if [[ -n "$DEFAULT_IF" && "$DEFAULT_IF" != "?" ]]; then
  if [[ "$DEFAULT_IF" == wl* ]]; then
    warn "Wi-Fi NIC ($DEFAULT_IF) — XDP genelde OFF; ipset-fallback beklenir."
  else
    echo "[OK] Kablolu/ethernet NIC adayi: $DEFAULT_IF"
  fi
fi

if systemctl is-active log-guardian-daemon &>/dev/null; then
  echo "[OK] log-guardian-daemon active"
else
  warn "log-guardian-daemon calismiyor — sudo systemctl start log-guardian-daemon"
fi

if [[ -S /run/log-guardian/ipc.sock ]]; then
  echo "[OK] IPC soket: /run/log-guardian/ipc.sock"
else
  warn "IPC soket yok"
fi

if [[ -f /run/log-guardian/daemon_stats.json ]]; then
  echo "[OK] daemon_stats.json mevcut"
else
  warn "daemon_stats.json yok"
fi

ST=$("$LG" --status --quiet --rules /etc/log-guardian/rules.conf 2>/dev/null || "$LG" --status --quiet 2>/dev/null || true)
if [[ -n "$ST" ]]; then
  python3 -c "
import json, sys
d = json.loads(sys.argv[1])
ipc = d.get('ipc', '?')
mode = d.get('xdp_mode', '?')
daemon = d.get('daemon') or {}
xdp = daemon.get('xdp_active')
l7 = daemon.get('l7_probe')
lineage = daemon.get('lineage_probe')
bp = d.get('ban_pipeline') or {}
print(f'ipc={ipc} xdp_mode={mode} xdp_active={xdp} l7_probe={l7} lineage_probe={lineage}')
print(f'ban_pipeline: ipc={bp.get(\"ipc\",0)} ipset={bp.get(\"ipset\",0)} failed={bp.get(\"failed\",0)}')
if ipc == 'ok' and mode == 'ipset-fallback':
    print('[OK] ipset-fallback — Wi-Fi/generic NIC icin normal')
elif ipc == 'ok' and mode == 'kernel-xdp':
    print('[OK] kernel-xdp aktif')
elif ipc == 'fail':
    print('[WARN] IPC fail — sudo systemctl restart log-guardian-daemon')
" "$ST"
else
  warn "--status alinamadi"
fi

if command -v ipset &>/dev/null && ipset list log_analyzer_block_v4 &>/dev/null; then
  n=$(ipset list log_analyzer_block_v4 2>/dev/null | grep -c '^[0-9]' || echo 0)
  echo "[OK] ipset log_analyzer_block_v4: ~${n} entry"
fi

echo "[OK] prod_nic_xdp_check tamam"
