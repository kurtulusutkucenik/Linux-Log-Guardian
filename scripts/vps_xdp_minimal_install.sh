#!/usr/bin/env bash
# VPS XDP ON — minimal blacklist program (Contabo verifier-safe)
#   sudo bash scripts/vps_xdp_minimal_install.sh
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[vps_xdp_minimal] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CONF="${LG_CONF:-/etc/log-guardian}"

echo "=== vps_xdp_minimal_install ==="

IFACE="$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' | head -1 || echo eth0)"
echo "iface=$IFACE"

systemctl stop log-guardian-daemon 2>/dev/null || true
rm -rf /sys/fs/bpf/loganalyzer/* 2>/dev/null || true
ip link set dev "$IFACE" xdp off 2>/dev/null || true

rm -f xdp_filter.o vmlinux.h
XDP_MINIMAL=1 make xdp_filter.o
install -m 755 xdp_filter.o "$CONF/xdp_filter.o"
echo "[OK] $CONF/xdp_filter.o (minimal)"

if [[ -x "$ROOT/scripts/vm_install_runtime_deps.sh" ]]; then
  bash "$ROOT/scripts/vm_install_runtime_deps.sh"
fi

LG_IFACE="$IFACE" bash "$ROOT/scripts/repair_daemon_unit.sh" 2>/dev/null || true
systemctl daemon-reload
systemctl enable log-guardian-daemon log-guardian 2>/dev/null || true
systemctl restart log-guardian-daemon log-guardian
sleep 4

echo "--- journal ---"
journalctl -u log-guardian-daemon -n 12 --no-pager | grep -E 'XDP|BPF|Driver|attach|failed' || true
echo "--- daemon_stats ---"
grep xdp_active /run/log-guardian/daemon_stats.json 2>/dev/null || true

if grep -q '"xdp_active":1' /run/log-guardian/daemon_stats.json 2>/dev/null; then
  echo "[OK] vps_xdp_minimal — XDP ON"
  bash "$ROOT/scripts/vps_xdp_proof.sh" || true
  exit 0
fi

echo "[FAIL] vps_xdp_minimal — xdp_active hala 0" >&2
echo "  Tam log: journalctl -u log-guardian-daemon -n 30 --no-pager" >&2
exit 1
