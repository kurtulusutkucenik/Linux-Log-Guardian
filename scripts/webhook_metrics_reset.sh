#!/usr/bin/env bash
# webhook fail sayaci sifirla — Grafana increase() stale alarm onleme
#   sudo bash scripts/webhook_metrics_reset.sh
#   sudo bash scripts/webhook_metrics_reset.sh --all
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LG="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG" ]] || LG="$ROOT/log-guardian"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"

ARGS=(webhook-metrics-reset)
[[ "${1:-}" == "--all" ]] && ARGS+=(--all)

OUT=$("$LG" "${ARGS[@]}" --rules "$RULES" 2>/dev/null)
echo "$OUT"
echo "$OUT" | grep -q '"fail":0' || { echo "[FAIL] webhook fail sifirlanamadi" >&2; exit 1; }
echo "[OK] webhook.metrics guncellendi"
