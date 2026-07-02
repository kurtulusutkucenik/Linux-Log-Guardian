#!/usr/bin/env bash
# 04:00 gövde gösterisi — Telegram + SIEM + dashboard URL'leri
#   bash scripts/demo_video.sh
#   SKIP_SIEM=1 bash scripts/demo_video.sh
#   SKIP_WEBHOOK=1 bash scripts/demo_video.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SITE_URL="${DEMO_SITE_URL:-https://ceniklinuxlogguardian.org}"
DASH_URL="${DASH_URL:-https://localhost:8443}"
SIEM_PORT="${SIEM_CAPTURE_PORT:-5044}"
SIEM_LOG="${LG_DEMO_SIEM_LOG:-$ROOT/.cache/demo_video_siem.log}"
CAP_PID=""
fail=0

cleanup() {
  [[ -n "$CAP_PID" ]] && kill "$CAP_PID" 2>/dev/null || true
}
trap cleanup EXIT

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Linux Log Guardian — DEMO VIDEO (gövde gösterisi)         ║"
  echo "╚══════════════════════════════════════════════════════════╝"
}

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

ok() { echo "  [OK] $*"; }
warn() { echo "  [WARN] $*"; fail=$((fail + 1)); }
info() { echo "  [INFO] $*"; }

pause_rec() {
  echo ""
  echo "  📱 KAMERA: $1"
  echo "  (5 sn bekle — Enter ile devam)"
  read -r _ || true
}

banner
echo ""
echo "Hazırlık:"
echo "  • Telegram uygulaması açık (bildirimler görünür)"
echo "  • İsteğe bağlı: dashboard sekmesi $DASH_URL/tests"
echo "  • İsteğe bağlı: site $SITE_URL/tests"
echo ""

step "0 — SIEM dinleyici (terminalde JSON akar)"
if [[ "${SKIP_SIEM:-0}" == "1" ]]; then
  info "SKIP_SIEM=1"
else
  rm -f "$SIEM_LOG"
  python3 "$ROOT/scripts/siem_capture.py" --port "$SIEM_PORT" --out "$SIEM_LOG" --timeout 120 &
  CAP_PID=$!
  sleep 0.5
  ok "SIEM capture :$SIEM_PORT → ${SIEM_LOG#$ROOT/}"
  info "Video B-roll: bu terminalde JSON satırları görünür"
fi

step "1 — Canlı saldırı → Telegram + kernel ban"
pause_rec "Telegram bildirimi (KRİTİK ALARM + IP BANLANDI)"

if [[ "${SKIP_WEBHOOK:-0}" == "1" ]]; then
  info "SKIP_WEBHOOK=1 — webhook_prod_e2e atlandi"
else
  export LG_BIN="${LG_BIN:-$ROOT/log-guardian}"
  if sudo env LG_DEMO_SIEM=1 SIEM_HOST=127.0.0.1 SIEM_PORT="$SIEM_PORT" SIEM_FORMAT=json \
    LIVE_WEBHOOK=1 WEBHOOK_PROD_FORCE=1 \
    LG_BIN="$LG_BIN" \
    bash "$ROOT/scripts/webhook_prod_e2e.sh"; then
    ok "webhook_prod_e2e (Telegram + ipset)"
  else
    warn "webhook_prod_e2e — sudo / webhook.env kontrol"
  fi
fi

sleep 3

step "2 — SIEM kanıt"
if [[ "${SKIP_SIEM:-0}" != "1" && -f "$SIEM_LOG" ]]; then
  siem_ban=0
  for _ in 1 2 3 4 5; do
    if grep -q '"event_type":"ban"' "$SIEM_LOG" 2>/dev/null; then
      siem_ban=1
      break
    fi
    sleep 1
  done
  if [[ "$siem_ban" -eq 1 ]]; then
    ok "SIEM ban event"
    tail -1 "$SIEM_LOG" | sed 's/^/    /'
  elif [[ -f "$ROOT/siem-export-report.json" ]] \
      && [[ "$(python3 -c "import json;print(json.load(open('$ROOT/siem-export-report.json')).get('ban_seen'))" 2>/dev/null)" == "True" ]]; then
    ok "SIEM ban event (siem_export rapor)"
  else
    warn "SIEM ban satiri yok — LG_DEMO_SIEM=1 binary guncel mi? make -j\$(nproc)"
  fi
  if grep -q '"event_type":"alert"' "$SIEM_LOG" 2>/dev/null; then
    ok "SIEM alert event"
  elif [[ -f "$ROOT/siem-export-report.json" ]] \
      && [[ "$(python3 -c "import json;print(json.load(open('$ROOT/siem-export-report.json')).get('alert_seen'))" 2>/dev/null)" == "True" ]]; then
    ok "SIEM alert event (siem_export rapor)"
  fi
  kill "$CAP_PID" 2>/dev/null || true
  CAP_PID=""
fi

step "3 — Ekran kaydı URL'leri (B-roll)"
info "Site testleri:     ${SITE_URL}/tests"
info "Dashboard test:    ${DASH_URL}/tests"
info "Kanıt PDF:         file://${ROOT}/docs/evidence/competitive-proof.pdf"
info "Yerel site önizle: LG_WEBSITE_PREVIEW=deploy bash scripts/preview_website.sh"

step "4 — Tek komut özet (stajyer / yönetici)"
echo "  Core: nginx log → WAF/CRS → kernel ban (~17 ms kanıt)"
echo "  Ops:  Telegram route (#waf / #ban) + SIEM JSON :5044"
echo "  Kanıt: docs/evidence/competitive-proof.pdf (24 otomatik test)"

echo ""
if [[ "${SKIP_WEBHOOK:-0}" != "1" ]]; then
  python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
  LG_SYNC_NO_SUDO=1 bash "$ROOT/scripts/sync_dashboard_data.sh" >/dev/null 2>&1 || true
fi
if [[ $fail -eq 0 ]]; then
  echo "[OK] demo_video — kayda hazir"
  exit 0
fi
echo "[WARN] demo_video — $fail uyari (yukariya bak)"
exit 1
