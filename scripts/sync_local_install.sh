#!/usr/bin/env bash
# Repo derlemesini /usr/local'e hizli sync (tam install.sh yerine)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PREFIX="${PREFIX:-/usr/local}"
fail() { echo "[sync_local_install] FAIL: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli: sudo bash scripts/sync_local_install.sh"

LG_QUIET_BUILD=1 make -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon

install -m 755 log-guardian "$PREFIX/bin/log-guardian"
install -m 755 log-guardian-daemon "$PREFIX/bin/log-guardian-daemon"
install -m 755 threat_intel.sh "$PREFIX/bin/log-guardian-threatintel"

for s in soak_start.sh soak_status.sh webhook_test_cli.sh webhook_dev.sh metrics_demo.sh stop_traffic.sh; do
  install -m 755 "$ROOT/scripts/$s" "$PREFIX/bin/log-guardian-${s%.sh}"
done

if systemctl is-active log-guardian log-guardian-daemon >/dev/null 2>&1; then
  systemctl restart log-guardian-daemon log-guardian
  echo "[sync_local_install] systemd yeniden baslatildi"
fi

echo "[OK] sync_local_install"
echo "  $PREFIX/bin/log-guardian --health"
echo "  log-guardian-webhook_test_cli alert"
