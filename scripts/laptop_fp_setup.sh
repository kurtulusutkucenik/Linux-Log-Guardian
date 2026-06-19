#!/usr/bin/env bash
# FP_LEARN isinma + prod store (/etc/log-guardian/data/fp-trust.lst)
#   bash scripts/laptop_fp_setup.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ "${EUID:-$(id -u)}" -eq 0 ]] && { echo "[laptop_fp_setup] sudo kullanmayin — once warmup, sonra install root ile" >&2; exit 1; }

echo "[laptop_fp_setup] FP warmup (overlay, ~1-2 dk)..."
bash "$ROOT/scripts/fp_learn_warmup.sh"

STORE="${FP_TRUST_STORE:-$ROOT/data/fp-trust-warmup.lst}"
[[ -f "$STORE" ]] || { echo "[laptop_fp_setup] FAIL: store yok: $STORE" >&2; exit 1; }

# stop -> install -> start: restart bos havuzu diske yazip warmup'i siler
echo "[laptop_fp_setup] log-guardian durduruluyor..."
sudo systemctl stop log-guardian || true

echo "[laptop_fp_setup] prod store kurulumu (sudo)..."
sudo bash "$ROOT/scripts/install_fp_trust_prod.sh" "$STORE"

echo "[laptop_fp_setup] log-guardian baslatiliyor..."
sudo systemctl start log-guardian

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
REL="data/fp-trust.lst"
[[ -f "$CONF" ]] && REL=$(grep -E '^FP_TRUST_STORE=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || echo "$REL")
BASE=$(dirname "$CONF")
if [[ "$REL" == /* ]]; then DEST="$REL"; else DEST="$BASE/$REL"; fi

sleep 1
lines=0
if [[ -s "$DEST" ]]; then
  lines=$(wc -l <"$DEST" | tr -d ' ')
elif sudo test -s "$DEST" 2>/dev/null; then
  lines=$(sudo wc -l <"$DEST" | tr -d ' ')
fi

if [[ "$lines" -gt 0 ]]; then
  echo "[OK] laptop_fp_setup — $DEST ($lines satir)"
  exit 0
fi

echo "[FAIL] fp-trust store bos: $DEST" >&2
echo "  journal: sudo journalctl -u log-guardian -n 30 --no-pager" >&2
echo "  elle: sudo systemctl stop log-guardian && sudo bash scripts/install_fp_trust_prod.sh && sudo systemctl start log-guardian" >&2
exit 1
