#!/usr/bin/env bash
# 3 dk canli demo: kanit PDF → webhook dry-run → dashboard (opsiyonel)
#   bash scripts/demo_3min.sh
#   SKIP_WEBHOOK=1 bash scripts/demo_3min.sh   # webhook yok
#   SKIP_DASHBOARD=1 bash scripts/demo_3min.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

DASH_URL="${DASH_URL:-https://localhost:8443}"
TESTS_URL="${DASH_URL}/tests"
EVIDENCE="$ROOT/docs/evidence"
fail=0

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

ok()  { echo "  [OK] $*"; }
info() { echo "  [INFO] $*"; }
warn() { echo "  [WARN] $*"; }

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Linux Log Guardian — 3 dk demo                          ║"
  echo "╚══════════════════════════════════════════════════════════╝"
}

find_pdf() {
  for p in \
    "$EVIDENCE/competitive-proof.pdf" \
    "$ROOT/competitive-proof.pdf" \
    "$ROOT/data-room/competitive-proof.pdf"; do
    [[ -f "$p" ]] && { echo "$p"; return 0; }
  done
  return 1
}

banner

step "1/8 Kanit PDF"
PDF=$(find_pdf || true)
if [[ -n "$PDF" ]]; then
  ok "PDF: $PDF"
  info "Dashboard: $DASH_URL/api/data-room/competitive-proof.pdf"
else
  info "PDF yok — uretiliyor..."
  if bash scripts/competitive_proof.sh >/dev/null 2>&1; then
  bash scripts/sync_evidence_pack.sh >/dev/null 2>&1 || true
    PDF=$(find_pdf || true)
    [[ -n "$PDF" ]] && ok "PDF olusturuldu: $PDF" || warn "competitive_proof tamamlandi ama PDF bulunamadi"
  else
    warn "competitive_proof atlandi — docs/evidence/competitive-proof.json mevcut mu?"
    [[ -f "$EVIDENCE/competitive-proof.json" ]] && ok "JSON kanit: $EVIDENCE/competitive-proof.json"
    fail=$((fail + 1))
  fi
fi

step "2/8 Sprint prod kaniti"
if [[ -f "$ROOT/sprint-prod-proof.json" ]]; then
  if python3 -c "import json; exit(0 if json.load(open('$ROOT/sprint-prod-proof.json')).get('pass') else 1)" 2>/dev/null; then
    ok "sprint-prod-proof.json pass=true"
  else
    warn "sprint-prod-proof.json pass=false — sudo bash scripts/sprint_harden_prod.sh"
  fi
elif bash scripts/sprint_prod_proof.sh >/dev/null 2>&1; then
  ok "sprint_prod_proof uretildi"
else
  info "sprint_prod_proof atlandi (/etc yok veya prod degil)"
fi

step "3/8 Webhook dry-run + P2 route"
if [[ "${SKIP_WEBHOOK:-0}" != "1" ]]; then
  if bash scripts/webhook_test_cli.sh alert >/dev/null 2>&1 \
      && bash scripts/webhook_test_cli.sh ban >/dev/null 2>&1; then
    ok "webhook_test_cli alert + ban"
  else
    warn "webhook dry-run — SKIP_WEBHOOK=1 veya webhook.env"
  fi
  if bash scripts/webhook_route_proof.sh >/dev/null 2>&1; then
    ok "webhook_route_proof (P2 batch)"
  else
    warn "webhook_route_proof atlandi"
  fi
else
  info "SKIP_WEBHOOK=1"
fi

step "4/8 Saldiri logu → ban webhook"
if [[ "${SKIP_WEBHOOK:-0}" != "1" ]]; then
  if bash scripts/webhook_ban_e2e.sh >/dev/null 2>&1; then
    ok "webhook_ban_e2e"
  else
    warn "webhook_ban_e2e atlandi (API/servis?)"
  fi
fi

step "5/8 nginx inline consult (opsiyonel)"
if [[ "${SKIP_WEBHOOK:-0}" == "1" ]]; then
  info "SKIP_WEBHOOK=1 — nginx_inline_consult_e2e atlandi"
elif command -v nginx >/dev/null 2>&1; then
  if bash scripts/nginx_inline_consult_e2e.sh >/dev/null 2>&1; then
    ok "nginx_inline_consult_e2e"
  else
    warn "inline consult — sudo bash scripts/fix_nginx_inline_consult.sh"
  fi
else
  info "nginx yok — inline consult atlandi"
fi

step "6/8 Dashboard /tests (opsiyonel)"
dash_ok=0
if [[ "${SKIP_DASHBOARD:-0}" != "1" ]] && command -v curl >/dev/null 2>&1; then
  if curl -skf "$TESTS_URL" -o /dev/null 2>/dev/null; then
    ok "dashboard: $TESTS_URL"
    dash_ok=1
  else
    info "dashboard kapali — yerel kanit:"
    info "  file://$EVIDENCE/"
    info "  cd landing && npm run dev  → http://127.0.0.1:3001/"
    info "  bash scripts/dashboard_stack.sh  → $DASH_URL"
  fi
else
  info "SKIP_DASHBOARD=1 veya curl yok"
fi

step "7/8 Ban gecikmesi (opsiyonel, root)"
if [[ "${SKIP_WEBHOOK:-0}" == "1" ]]; then
  info "SKIP_WEBHOOK=1 — bench_ban_latency atlandi"
  [[ -f "$EVIDENCE/bench-ban-latency.json" || -f bench-ban-latency.json ]] \
    && ok "mevcut bench-ban-latency.json"
elif [[ $EUID -eq 0 ]]; then
  bash scripts/bench_ban_latency.sh >/dev/null 2>&1 && ok "bench_ban_latency" \
    || warn "bench_ban_latency basarisiz"
elif sudo -n true 2>/dev/null; then
  sudo bash scripts/bench_ban_latency.sh >/dev/null 2>&1 && ok "bench_ban_latency" \
    || warn "bench_ban_latency basarisiz"
else
  info "sudo bash scripts/bench_ban_latency.sh (opsiyonel)"
  [[ -f "$EVIDENCE/bench-ban-latency.json" || -f bench-ban-latency.json ]] \
    && ok "mevcut bench-ban-latency.json"
fi

if [[ "${SKIP_SYNC:-0}" != "1" ]]; then
  bash scripts/sync_dashboard_data.sh >/dev/null 2>&1 || true
  bash scripts/sync_evidence_pack.sh >/dev/null 2>&1 || true
  python3 scripts/sync_landing_tests_from_proof.py >/dev/null 2>&1 || true
fi

step "8/8 Landing parity (security.txt + test kartlari)"
if [[ -f "$ROOT/landing/public/security.txt" ]] && [[ -f "$ROOT/landing/public/.well-known/security.txt" ]]; then
  ok "security.txt + .well-known/security.txt"
else
  warn "security.txt eksik — landing/public/"
fi
if bash scripts/website_preview_gate.sh >/dev/null 2>&1; then
  ok "website_preview_gate (76 test parity)"
else
  warn "website_preview_gate — python3 scripts/sync_landing_tests_from_proof.py"
fi
info "Canli site: https://ceniklinuxlogguardian.org/testler?utm_source=demo"

echo ""
echo "=== demo ozet ==="
echo "  PDF/JSON : ${PDF:-$EVIDENCE/competitive-proof.json}"
if [[ "$dash_ok" -eq 1 ]]; then
  echo "  Dashboard: acik — $TESTS_URL"
else
  echo "  Dashboard: kapali — yerel kanit yeterli"
fi
echo "  Website  : cd landing && npm run dev"
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] demo_3min tamam"
  exit 0
fi
echo "[WARN] demo_3min — $fail adim eksik (core demo icin JSON/PDF yeterli)" >&2
exit 0
