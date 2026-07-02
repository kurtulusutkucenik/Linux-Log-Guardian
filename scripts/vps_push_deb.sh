#!/usr/bin/env bash
# Laptop -> VPS: .deb kopyala + uzaktan vps_bootstrap
#   VPS_HOST=kurtulus@203.0.113.1 bash scripts/vps_push_deb.sh
#   VPS_HOST=root@vps.example.com LG_DEB=dist/log-guardian_0.c9b9af1_amd64.deb bash scripts/vps_push_deb.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HOST="${VPS_HOST:-}"
[[ -n "$HOST" ]] || { echo "[vps_push_deb] FAIL: VPS_HOST=user@ip gerekli" >&2; exit 1; }

# VirtualBox NAT guest IP (10.0.2.15) host'tan SSH ile ERISILEMEZ
ip_part="${HOST#*@}"
if [[ "$ip_part" =~ ^10\.0\.2\.[0-9]+$ ]]; then
  echo "[vps_push_deb] FAIL: $ip_part = VirtualBox VM ic IP (NAT)" >&2
  echo "" >&2
  echo "  Bu VPS degil — VM. SSH timeout normal." >&2
  echo "  VM icinde:" >&2
  echo "    sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true" >&2
  echo "    sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  echo "    sudo bash /mnt/lg/scripts/vm_install_deb.sh    # .deb kurulum" >&2
  echo "" >&2
  echo "  Gercek VPS: internetteki sunucu IP (ornek root@203.0.113.50)" >&2
  exit 1
fi

DEB="${LG_DEB:-$(ls -1t dist/log-guardian_*.deb 2>/dev/null | head -1)}"
[[ -f "$DEB" ]] || { echo "[vps_push_deb] FAIL: .deb yok — bash scripts/build_deb.sh" >&2; exit 1; }

REMOTE_DIR="${VPS_REMOTE_DIR:-/tmp/log-guardian-install}"
DEB_BASE="$(basename "$DEB")"

echo "=== vps_push_deb ==="
echo "  host: $HOST"
echo "  deb:  $DEB"

ssh -o BatchMode="${VPS_SSH_BATCH:-yes}" "$HOST" "mkdir -p '$REMOTE_DIR'"
scp -o BatchMode="${VPS_SSH_BATCH:-yes}" "$DEB" "$HOST:$REMOTE_DIR/$DEB_BASE"
scp -o BatchMode="${VPS_SSH_BATCH:-yes}" "$ROOT/scripts/vps_bootstrap.sh" "$HOST:$REMOTE_DIR/"

ssh -t "$HOST" "cd '$REMOTE_DIR' && sudo LG_DEB='$REMOTE_DIR/$DEB_BASE' bash '$REMOTE_DIR/vps_bootstrap.sh'"

echo "[OK] vps_push_deb — uzak bootstrap bitti"
