#!/usr/bin/env bash
# Kanıt dosyalarını landing/public/evidence/ altına kopyala (PDF, JSON)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/landing/public/evidence"
mkdir -p "$OUT"

SOURCES=(
  "$ROOT/assets/website/evidence"
  "$ROOT/docs/evidence"
  "$ROOT"
)

FILES=(
  competitive-proof.json
  competitive-proof.pdf
  bench-vs-modsec.json
  fp-report.json
  bench-ban-latency.json
  soak-report.json
)

copied=0
for f in "${FILES[@]}"; do
  for src_dir in "${SOURCES[@]}"; do
    if [[ -f "$src_dir/$f" ]]; then
      cp -f "$src_dir/$f" "$OUT/$f"
      echo "[landing_sync_assets] $f"
      copied=$((copied + 1))
      break
    fi
  done
done

# Logo / favicon (opsiyonel)
for asset in logo.png favicon.ico; do
  for src_dir in "$ROOT/assets/website" "$ROOT"; do
    if [[ -f "$src_dir/$asset" ]]; then
      cp -f "$src_dir/$asset" "$ROOT/landing/public/$asset"
      echo "[landing_sync_assets] public/$asset"
      break
    fi
  done
done

echo "[OK] landing_sync_assets — $copied kanıt dosyası -> landing/public/evidence/"
