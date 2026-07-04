#!/usr/bin/env bash
# DIST_RISK — dagitik saldiri skoru (JA3/UA + /24 + ulke) statik kanit
#   bash scripts/dist_risk_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== dist_risk_e2e ==="

[[ -f dist_risk.c && -f dist_risk.h ]] \
  && ok "dist_risk modulu" \
  || bad "dist_risk.c/h yok"

grep -q 'dist_risk_bonus' ban_policy.c \
  && ok "ban_policy dist_risk_bonus" \
  || bad "ban_policy bonus yok"

grep -q 'dist_risk_observe' main.c \
  && ok "main.c dist_risk_observe" \
  || bad "main.c observe yok"

grep -q '^DIST_RISK=' rules.conf \
  && ok "rules.conf DIST_RISK" \
  || bad "rules.conf DIST_RISK yok"

grep -q 'dist_risk.c' Makefile \
  && ok "Makefile dist_risk.c" \
  || bad "Makefile kaynak yok"

grep -q 'loganalyzer_dist_risk_bonus_applied_total' metrics.c \
  && ok "Prometheus dist_risk metrikleri" \
  || bad "dist_risk metrikleri yok"

grep -q 'DIST risk buckets' grafana-dashboard.json \
  && ok "Grafana DIST_RISK paneli" \
  || bad "Grafana paneli yok"

[[ "$fail" -eq 0 ]] || exit 1
ok "dist_risk_e2e tamam"
