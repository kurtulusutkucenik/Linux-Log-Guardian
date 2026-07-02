#!/usr/bin/env bash
# VPS tek komut kurulum — GERCEK sunucuda (internet IP), VM'de DEGIL
#   sudo bash scripts/vps_bootstrap.sh
# VM icinde: sudo bash /mnt/lg/scripts/vm_install_deb.sh
# Laptop'tan VPS: VPS_HOST=root@GERCEK_IP bash scripts/vps_push_deb.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[vps_bootstrap] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

if command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]]; then
  fail "VM icindesin — vps_bootstrap VPS icin. Kullan: sudo bash /mnt/lg/scripts/vm_install_deb.sh"
fi
[[ "${HOSTNAME:-}" == *VirtualBox* ]] && \
  fail "VM hostname — vps_bootstrap degil. sudo bash /mnt/lg/scripts/vm_install_deb.sh"

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"

DEB="${LG_DEB:-}"
if [[ -z "$DEB" ]]; then
  DEB="$(ls -1t "$ROOT"/dist/log-guardian_*.deb 2>/dev/null | head -1 || true)"
fi
[[ -n "$DEB" && -f "$DEB" ]] || fail ".deb yok — laptop: bash scripts/build_deb.sh"

IFACE="$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' | head -1 || echo eth0)"
ok "iface=$IFACE deb=$(basename "$DEB")"

echo "=== [1/4] dpkg -i ==="
if ! dpkg -i "$DEB"; then
  apt-get install -f -y
  dpkg -i "$DEB"
fi
ok "paket kuruldu"

echo "=== [2/4] install_first_run ==="
FIRST="$ROOT/scripts/install_first_run.sh"
[[ -f "$FIRST" ]] || FIRST="/usr/local/share/log-guardian/scripts/install_first_run.sh"
bash "$FIRST"
ok "install_first_run"

echo "=== [3/4] sprint_harden_prod (RULES_VERIFY + STIX) ==="
if [[ "${VPS_SKIP_SPRINT:-0}" != "1" ]]; then
  HARDEN="$ROOT/scripts/sprint_harden_prod.sh"
  [[ -f "$HARDEN" ]] || HARDEN="/usr/local/share/log-guardian/scripts/sprint_harden_prod.sh"
  LG_BIN=/usr/local/bin/log-guardian bash "$HARDEN"
  ok "sprint_harden_prod"
else
  echo "[INFO] VPS_SKIP_SPRINT=1 — atlandi"
fi

echo "=== [4/4] vps_xdp_proof ==="
PROOF="$ROOT/scripts/vps_xdp_proof.sh"
[[ -f "$PROOF" ]] || PROOF="/usr/local/share/log-guardian/scripts/vps_xdp_proof.sh"
bash "$PROOF"

echo ""
echo "[OK] vps_bootstrap — VPS prod + XDP kaniti tamam"
echo "  Sonraki: sudo bash scripts/install_soak_systemd.sh  # 72h soak"
echo "  Edge:     sudo bash scripts/prod_edge_setup.sh"
