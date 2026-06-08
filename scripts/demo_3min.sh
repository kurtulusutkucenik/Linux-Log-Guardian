#!/usr/bin/env bash
# 3 dk canli demo: log -> WAF -> ban -> webhook -> dashboard
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DASH_URL="${DASH_URL:-https://localhost:8443}"
TESTS_URL="${DASH_URL}/tests"
PDF_URL="${DASH_URL}/api/data-room/competitive-proof.pdf"

step() {
  echo ""
  echo "▶ $*"
  echo "────────────────────────────────────────"
}

banner() {
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  Linux Log Guardian — 3 dk demo                          ║"
  echo "╚══════════════════════════════════════════════════════════╝"
}

banner
step "1/5 Kanit PDF (data room)"
if [[ -f competitive-proof.pdf ]]; then
  echo "  Dosya: competitive-proof.pdf"
  echo "  Tarayici: $PDF_URL"
else
  bash scripts/competitive_proof.sh
fi

step "2/5 Webhook dry-run (Slack/Discord/Telegram onizleme)"
if [[ "${SKIP_WEBHOOK:-0}" != "1" ]]; then
  bash scripts/webhook_test_cli.sh alert
  bash scripts/webhook_test_cli.sh ban
else
  echo "  [SKIP] SKIP_WEBHOOK=1"
fi

step "3/5 Saldiri logu -> alarm -> ban webhook"
if [[ "${SKIP_WEBHOOK:-0}" != "1" ]]; then
  bash scripts/webhook_ban_e2e.sh
fi

step "4/5 Dashboard test paneli"
echo "  Testler: $TESTS_URL"
echo "  Ana sayfa: $DASH_URL"
if command -v curl >/dev/null 2>&1; then
  if curl -skf "$TESTS_URL" -o /dev/null 2>/dev/null; then
    echo "  [OK] dashboard erisilebilir"
  else
    echo "  [INFO] dashboard kapali — docker compose -f docker-compose.prod.yml up -d dashboard"
  fi
fi

step "5/5 Ban gecikmesi (opsiyonel, root)"
bench_run() {
  if [[ $EUID -eq 0 ]]; then
    bash scripts/bench_ban_latency.sh
  elif sudo -n true 2>/dev/null; then
    sudo bash scripts/bench_ban_latency.sh
  else
    echo "  [SKIP] sudo bash scripts/bench_ban_latency.sh"
    return 0
  fi
}
if ! bench_run; then
  echo "  [WARN] ban bench basarisiz — sprint/demo devam ediyor (bench-ban-latency.json kontrol edin)"
fi

bash scripts/sync_dashboard_data.sh 2>/dev/null || true

echo ""
echo "Demo tamam. Topluluga goster:"
echo "  1) PDF — ne sunuyoruz / ne iddia etmiyoruz"
echo "  2) /tests — otomatik dogrulamalar"
echo "  3) webhook dry-run ciktisi — ban bildirimi kanallari"
echo ""
