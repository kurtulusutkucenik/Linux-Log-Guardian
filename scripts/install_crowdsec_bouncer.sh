#!/usr/bin/env bash
# CrowdSec bouncer systemd timer — LAPI -> log-guardian ban API
#   sudo bash scripts/install_crowdsec_bouncer.sh
#   sudo systemctl enable --now log-guardian-crowdsec-bouncer.timer
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETC="${LG_ETC:-/etc/log-guardian}"
SVC_SRC="$ROOT/deploy/log-guardian-crowdsec-bouncer.service"
TMR_SRC="$ROOT/deploy/log-guardian-crowdsec-bouncer.timer"
SVC_DST="/etc/systemd/system/log-guardian-crowdsec-bouncer.service"
TMR_DST="/etc/systemd/system/log-guardian-crowdsec-bouncer.timer"
LG_ROOT="${LG_INSTALL_ROOT:-$ROOT}"

fail() { echo "[install_crowdsec_bouncer] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"
[[ -f "$SVC_SRC" && -f "$TMR_SRC" ]] || fail "deploy unit dosyalari yok"
[[ -x "$LG_ROOT/scripts/crowdsec_bouncer_sync.sh" ]] || \
  fail "crowdsec_bouncer_sync.sh yok ($LG_ROOT/scripts/)"

install -d "$ETC"
if [[ ! -f "$ETC/crowdsec.env" ]]; then
  install -m 600 "$ROOT/deploy/crowdsec.env.example" "$ETC/crowdsec.env"
  ok "ornek crowdsec.env -> $ETC/crowdsec.env (CROWDSEC_API_KEY doldur)"
else
  ok "crowdsec.env mevcut"
fi

sed "s|@LG_ROOT@|${LG_ROOT//|/\\|}|g" "$SVC_SRC" >"$SVC_DST"
cp "$TMR_SRC" "$TMR_DST"
systemctl daemon-reload
ok "systemd unit + timer kuruldu"

echo ""
echo "  # API key ekle (CrowdSec kuruluysa):"
echo "  sudo nano $ETC/crowdsec.env"
echo ""
echo "  # Timer ac:"
echo "  sudo systemctl enable --now log-guardian-crowdsec-bouncer.timer"
echo ""
echo "  # Dry-run test (sudo yok):"
echo "  bash scripts/crowdsec_bouncer_e2e.sh"
echo ""
echo "  # Canli API test (:8090 acik):"
echo "  LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh"
