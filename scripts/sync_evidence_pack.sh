#!/usr/bin/env bash
# Kanit JSON/PDF -> docs/evidence/ (web sitesi + data room)
#   bash scripts/sync_evidence_pack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${LG_EVIDENCE_DIR:-$ROOT/docs/evidence}"
mkdir -p "$OUT"

# Ilk bulunan kaynak (kok > data-room > release-pack) — cift log yok
copy_first() {
  local name="$1"
  shift
  local src
  for src in "$@"; do
    if [[ -f "$src" ]]; then
      cp -f "$src" "$OUT/$name"
      echo "[sync_evidence] docs/evidence/$name"
      return 0
    fi
  done
}

for f in \
  competitive-proof.json \
  competitive-proof.pdf \
  bench-vs-modsec.json \
  fp-report.json \
  bench-ban-latency.json \
  guardian-status.json \
  crs-parity-report.json \
  compliance-report.json \
  soak-report.json \
  sprint-prod-proof.json \
  siem-export-report.json \
  taxii-feed-report.json \
  parser-fuzz-report.json \
  ban-policy-audit-report.json \
  lineage-incident-report.json \
  vm-sprint-proof.json \
  geoip-mmdb-report.json \
  webhook-route-proof-report.json \
  webhook-telegram-live-report.json; do
  copy_first "$f" \
    "$ROOT/$f" \
    "$ROOT/.cache/$f" \
    "$ROOT/data-room/$f" \
    "$ROOT/release-pack/$f"
done

# Statik site (preview / GitHub Pages) — yalnizca publish.allowlist dosyalari
WEB_EVIDENCE="$ROOT/assets/website/evidence"
WEB_EVIDENCE_ALLOW=(
  competitive-proof.json
  competitive-proof.pdf
  bench-vs-modsec.json
  fp-report.json
  bench-ban-latency.json
  soak-report.json
  SOAK_SUMMARY.md
  sprint-prod-proof.json
  siem-export-report.json
  taxii-feed-report.json
  vm-sprint-proof.json
  geoip-mmdb-report.json
  webhook-route-proof-report.json
  webhook-telegram-live-report.json
)
if [[ -d "$ROOT/assets/website" ]]; then
  mkdir -p "$WEB_EVIDENCE"
  for f in "${WEB_EVIDENCE_ALLOW[@]}"; do
    copied=0
    for src in "$ROOT/docs/evidence/$f" "$ROOT/$f" "$ROOT/data-room/$f"; do
      if [[ -f "$src" ]]; then
        cp -f "$src" "$WEB_EVIDENCE/$f"
        echo "[sync_evidence] website/evidence/$f"
        copied=1
        break
      fi
    done
    [[ "$copied" -eq 0 ]] && echo "[sync_evidence] website atla (yok): $f" >&2
  done
  # Allowlist disi dosyalari kaldir (saldiri yuzeyi)
  shopt -s nullglob
  for extra in "$WEB_EVIDENCE"/*; do
    base="$(basename "$extra")"
    keep=0
    for f in "${WEB_EVIDENCE_ALLOW[@]}"; do
      [[ "$base" == "$f" ]] && keep=1 && break
    done
    [[ "$keep" -eq 0 ]] && rm -f "$extra" && echo "[sync_evidence] website silindi: $base"
  done
  shopt -u nullglob
  web_count="$(find "$WEB_EVIDENCE" -maxdepth 1 -type f 2>/dev/null | wc -l)"
  echo "[OK] website/evidence -> $web_count dosya (allowlist)"
fi

echo "[OK] sync_evidence_pack -> $OUT"
