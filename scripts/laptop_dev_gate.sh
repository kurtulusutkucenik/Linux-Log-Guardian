#!/usr/bin/env bash
# Laptop gelistirme kapisi — VPS, webhook, canli nginx gerekmez (~10-20 dk)
#   bash scripts/laptop_dev_gate.sh
#   SKIP_CONSULT=1 bash scripts/laptop_dev_gate.sh   # API yoksa
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export COMPETITIVE_FAST="${COMPETITIVE_FAST:-1}"
# 1K corpus kategori replay laptop'ta timeout — 10K ile ayni hizli yol
export REAL_ATTACK_SKIP_CATEGORIES="${REAL_ATTACK_SKIP_CATEGORIES:-1}"
export REAL_ATTACK_REPLAY_TIMEOUT="${REAL_ATTACK_REPLAY_TIMEOUT:-600}"

fail() { echo "[laptop_dev_gate] FAIL: $*" >&2; exit 1; }
warn() { echo "[laptop_dev_gate] WARN: $*" >&2; }
step() { echo ""; echo "── [$1] $2"; }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — laptop dev gate (VPS/webhook yok) ║"
echo "╚══════════════════════════════════════════════════════════╝"

step 1 "Derleme"
make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian tester

step 2 "Gercek saldiri corpus"
LIVE="${LIVE:-0}"
if [[ "$LIVE" != "1" ]] && bash scripts/detect_nginx_live.sh 2>/dev/null; then
  LIVE=1
  echo "[laptop_dev_gate] nginx :80 acik — LIVE=1 otomatik"
fi
LIVE="$LIVE" bash scripts/real_attack_suite.sh

step 3 "OWASP + TR hosting + threat intel"
bash scripts/extended_proof_pack.sh

step 4 "JA3 / dagitik cluster"
bash scripts/ja3_cluster_proof.sh

step 5 "CRS parity + ban policy + incident"
bash scripts/crs_parity_test.sh
bash scripts/ban_policy_test.sh
bash scripts/proof_replay_webhook_ban.sh
bash scripts/incident_e2e.sh

step 6 "False positive raporu"
bash scripts/fp_report.sh

step 7 "nginx log_guardian format (nginx varsa)"
if command -v nginx >/dev/null 2>&1; then
  bash scripts/check_nginx_log_format.sh 2>/dev/null \
    || warn "log_guardian eksik — sudo bash scripts/fix_nginx_log_format.sh"
else
  warn "nginx yok — format kontrolu atlandi"
fi

step "7b" "nginx inline+log hibrit (oncelik #4)"
if command -v nginx >/dev/null 2>&1; then
  if bash scripts/nginx_hybrid_proof.sh 2>/dev/null; then
    :
  else
    warn "hibrit kanit eksik — sudo bash scripts/fix_nginx_inline_consult.sh"
    warn "  sudo systemctl start nginx && bash scripts/nginx_hybrid_proof.sh"
  fi
else
  warn "nginx yok — hibrit atlandi"
fi

if [[ "${SKIP_CONSULT:-0}" != "1" ]]; then
  step 8 "nginx inline consult (API gerekli)"
  if ! curl -sf --max-time 2 http://127.0.0.1:8090/api/v1/metrics >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo env AUTO_RESTART=1 AUTO_FIX=1 bash scripts/ensure_guardian_api.sh 2>/dev/null \
        || warn "API onarimi basarisiz — sudo bash scripts/fix_analyzer.sh"
    fi
  fi
  if bash scripts/nginx_inline_consult_proof.sh 2>/dev/null; then
    :
  else
    warn "consult atlandi — log-guardian API calismiyor (SKIP_CONSULT=1 ile atlayabilirsiniz)"
    warn "  sudo bash scripts/fix_analyzer.sh && bash scripts/nginx_inline_consult_proof.sh"
  fi
else
  warn "[8] nginx consult SKIP_CONSULT=1"
fi

step 9 "Competitive proof merge"
bash scripts/competitive_proof.sh 2>/dev/null || true
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

echo ""
echo "[OK] laptop_dev_gate tamam"
echo "  Sonraki: cd dashboard && npm run dev  →  /tests paneli"
echo "  Rehber: docs/HOSTING_RUNBOOK_TR.md"
