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
  ban-profile-e2e-report.json \
  dist-risk-proof-report.json \
  nginx-hybrid-report.json \
  ipv6-ban-e2e-report.json \
  api-mutation-token-e2e-report.json \
  ban-api-mtls-report.json \
  lineage-incident-report.json \
  fleet-multi-node-report.json \
  vm-fleet-gate-report.json \
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

# Not: canli site kanit dagitimi artik landing/ (Next.js) uzerinden;
# landing/public/evidence icin: bash scripts/landing_sync_assets.sh

echo "[OK] sync_evidence_pack -> $OUT"
