#!/usr/bin/env bash
# 08:00 demo provasi — laptop akisi (token silmez / rotate etmez)
#   bash scripts/demo_rehearsal.sh                    # varsayilan SKIP_WEBHOOK=1 (Telegram spam yok)
#   LIVE_WEBHOOK=1 bash scripts/demo_rehearsal.sh     # gercek Telegram alarm+ban provasi
#   SKIP_LIVE_SITE=1 bash scripts/demo_rehearsal.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Rutin provada kanala gercek KRITIK ALARM gitmesin (webhook_prod_e2e)
if [[ "${LIVE_WEBHOOK:-0}" == "1" ]]; then
  SKIP_WEBHOOK=0
fi
SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"

SITE_URL="${DEMO_SITE_URL:-https://ceniklinuxlogguardian.org}"
fail=0

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Linux Log Guardian — demo provasi                       ║"
  echo "╚══════════════════════════════════════════════════════════╝"
}

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

ok() { echo "  [OK] $*"; }
warn() { echo "  [WARN] $*"; fail=$((fail + 1)); }

banner

step "0/4 Canli site (opsiyonel)"
if [[ "${SKIP_LIVE_SITE:-0}" == "1" ]]; then
  echo "  SKIP_LIVE_SITE=1"
else
  if bash scripts/website_live_css_check.sh; then
    ok "live CSS SRI"
  else
    warn "live CSS — deploy veya CF cache"
  fi
  if bash scripts/website_live_js_check.sh; then
    ok "live JS SRI + test kartlari"
  else
    warn "live JS — CF Auto Minify OFF + _redirects dongu yok + redeploy"
  fi
  echo "  Manuel: ${SITE_URL}/  · ${SITE_URL}/tests"
fi

step "1/4 security_closure_gate (L3/L4 haric)"
if bash scripts/security_closure_gate.sh; then
  ok "security_closure_gate"
else
  warn "security_closure_gate"
fi

step "2/4 demo_3min"
if bash scripts/demo_3min.sh; then
  ok "demo_3min"
else
  warn "demo_3min"
fi

step "3/4 webhook prod e2e"
if [[ "${SKIP_WEBHOOK}" == "1" ]]; then
  echo "  SKIP_WEBHOOK=1 (gercek Telegram icin: LIVE_WEBHOOK=1 bash scripts/demo_rehearsal.sh)"
else
  if bash scripts/webhook_prod_e2e.sh; then
    ok "webhook_prod_e2e"
  else
    warn "webhook_prod_e2e"
  fi
fi

step "4/4 Ozet"
echo ""
if [[ $fail -eq 0 ]]; then
  echo "[OK] demo_rehearsal — 08:00 akisi hazir"
  echo "  Site:    ${SITE_URL}/tests"
  echo "  Dash:    ${DASH_URL:-https://localhost:8443}/tests"
  bash "$ROOT/scripts/demo_rehearsal_gate.sh" >/dev/null 2>&1 \
    && echo "  Gate:    demo_rehearsal_gate PASS" \
    || echo "  Gate:    bash scripts/demo_rehearsal_gate.sh"
  exit 0
fi
echo "[WARN] demo_rehearsal — $fail uyari (yukaridaki satirlara bak)"
exit 1
