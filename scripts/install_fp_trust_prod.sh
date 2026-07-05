#!/usr/bin/env bash
# FP trust store -> prod (/etc/log-guardian)
#   bash scripts/fp_learn_warmup.sh
#   sudo bash scripts/install_fp_trust_prod.sh
#   sudo bash scripts/install_fp_trust_prod.sh data/fp-trust.lst
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

resolve_store() {
  local rel="${1:-data/fp-trust.lst}"
  local base="/etc/log-guardian"
  if [[ -f "$CONF" ]]; then
    rel=$(grep -E '^FP_TRUST_STORE=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || echo "$rel")
    base=$(dirname "$CONF")
  fi
  if [[ "$rel" == /* ]]; then
    echo "$rel"
  else
    echo "$base/$rel"
  fi
}

SRC="${1:-}"
if [[ -z "$SRC" ]]; then
  best=""
  best_n=0
  for c in "$ROOT/data/fp-trust.lst" "$ROOT/data/fp-trust-warmup.lst"; do
    [[ -f "$c" ]] || continue
    n=$(wc -l <"$c" | tr -d ' ')
    if [[ "$n" -gt "$best_n" ]]; then
      best="$c"
      best_n="$n"
    fi
  done
  SRC="$best"
fi
[[ -n "$SRC" && -f "$SRC" ]] || {
  echo "[install_fp_trust] FAIL: kaynak yok" >&2
  echo "  once: bash scripts/fp_learn_warmup.sh" >&2
  echo "  veya: sudo bash scripts/install_fp_trust_prod.sh /path/to/fp-trust.lst" >&2
  exit 1
}

DEST="$(resolve_store)"
DEST_DIR=$(dirname "$DEST")

[[ "$(id -u)" -eq 0 ]] || { echo "[install_fp_trust] sudo gerekli" >&2; exit 1; }

src_n=$(wc -l <"$SRC" | tr -d ' ')
dest_n=0
[[ -f "$DEST" ]] && dest_n=$(wc -l <"$DEST" | tr -d ' ')
if [[ "$dest_n" -gt 0 && "$src_n" -lt "$dest_n" && "${FORCE:-0}" != "1" ]]; then
  echo "[install_fp_trust] SKIP: prod store daha zengin ($dest_n > $src_n satir) — korundu: $DEST"
  echo "  bilerek degistirmek icin: sudo FORCE=1 bash scripts/install_fp_trust_prod.sh \"$SRC\""
  echo "  veya daha zengin store: sudo bash scripts/install_fp_trust_prod.sh  # en buyuk repo dosyasi"
  exit 0
fi

mkdir -p "$DEST_DIR"
chown root:log-guardian "$DEST_DIR" 2>/dev/null || true
chmod 2770 "$DEST_DIR"
install -m 660 -o log-guardian -g log-guardian "$SRC" "$DEST"
lines=$(wc -l <"$DEST" | tr -d ' ')
echo "[OK] install_fp_trust: $SRC -> $DEST ($lines satir)"
echo "  sudo systemctl stop log-guardian   # calisiyorsa — restart bos havuzu diske yazabilir"
echo "  sudo systemctl start log-guardian"
