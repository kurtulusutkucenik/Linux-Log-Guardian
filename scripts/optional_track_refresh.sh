#!/usr/bin/env bash
# Opsiyonel track paketi — A4 L7 + C2 demo + C3 Grafana (+ B4 landing export)
#   bash scripts/optional_track_refresh.sh
#   SKIP_L7=1 bash scripts/optional_track_refresh.sh
#   PUBLISH=1 bash scripts/optional_track_refresh.sh   # Cloudflare deploy (wrangler)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail=0
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); }
ok() { echo "[OK] $*"; }

echo "=== optional_track_refresh ==="

echo "--- [A4] L7 + webhook (filo yok) ---"
if [[ "${SKIP_L7:-0}" != "1" ]]; then
  if bash "$ROOT/scripts/l7_probe_prod_e2e.sh" >/dev/null 2>&1; then
    ok "l7_probe_prod_e2e (zaten aktif)"
  else
    if [[ "$(id -u)" -eq 0 ]]; then
      bash "$ROOT/scripts/laptop_optional_layers_on.sh" --skip-fleet \
        && ok "laptop_optional_layers_on" \
        || warn "laptop_optional_layers_on"
    else
      sudo bash "$ROOT/scripts/laptop_optional_layers_on.sh" --skip-fleet \
        && ok "laptop_optional_layers_on" \
        || warn "laptop_optional_layers_on"
    fi
    bash "$ROOT/scripts/l7_probe_prod_e2e.sh" 2>/dev/null && ok "l7_probe_prod_e2e" \
      || warn "l7_probe_prod_e2e"
  fi
else
  echo "[SKIP] L7 — SKIP_L7=1"
fi

echo "--- [C3] Grafana alert e2e ---"
if bash "$ROOT/scripts/grafana_alert_e2e.sh" 2>/dev/null; then
  ok "grafana_alert_e2e"
else
  bash "$ROOT/scripts/grafana_alert_e2e.sh" --check-only 2>/dev/null \
    && warn "grafana_alert_e2e (yalniz policy — Telegram canli atlandi)" \
    || warn "grafana_alert_e2e"
fi

echo "--- [C2] demo_3min ---"
bash "$ROOT/scripts/demo_3min.sh" && ok "demo_3min" || warn "demo_3min"

echo "--- [B4] landing export + preview ---"
bash "$ROOT/scripts/website_landing_export.sh" && ok "website_landing_export" || warn "website_landing_export"
bash "$ROOT/scripts/website_preview_gate.sh" && ok "website_preview_gate" || warn "website_preview_gate"

if [[ "${PUBLISH:-0}" == "1" ]]; then
  echo "--- [B4] canli site publish ---"
  bash "$ROOT/scripts/website_publish.sh" && ok "website_publish" || warn "website_publish"
fi

echo "--- kanit sync ---"
REFRESH_CORE_PROOF=1 bash "$ROOT/scripts/competitive_proof.sh" 2>/dev/null \
  && ok "competitive_proof (REFRESH_CORE_PROOF=1)" \
  || warn "competitive_proof"
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null && ok "sync_dashboard_data" || warn "sync_dashboard_data"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] optional_track_refresh tamam"
  echo "  Telegram link: https://ceniklinuxlogguardian.org/testler?utm_source=tg"
  echo "  Dashboard: bash scripts/dashboard_refresh.sh  (UI degistiyse)"
  [[ "${PUBLISH:-0}" == "1" ]] || echo "  Canli: PUBLISH=1 bash scripts/optional_track_refresh.sh"
  exit 0
fi
echo "[WARN] optional_track_refresh — $fail uyari (core stack etkilenmedi)" >&2
exit 0
