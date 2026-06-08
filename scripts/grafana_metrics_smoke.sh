#!/usr/bin/env bash
# Grafana SOC metrikleri — /metrics uzerinde yeni loganalyzer_* alanlari
#   bash scripts/grafana_metrics_smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${METRICS_PORT:-9091}"
URL="http://127.0.0.1:${PORT}/metrics"
INSTALLED="${LOG_GUARDIAN_BIN:-/usr/local/bin/log-guardian}"
REPO="$ROOT/log-guardian"

need=(
  loganalyzer_threat_last_sync_ts
  loganalyzer_threat_total_iocs
  loganalyzer_threat_feed_enabled
  loganalyzer_fp_trusted_ips
  loganalyzer_fp_learn_enabled
  loganalyzer_ban_pipeline_ipc
  loganalyzer_ban_pipeline_ipset
  loganalyzer_ja3_clusters_active
  loganalyzer_ja3_cluster_bans_total
)

has_metric_in_binary() {
  local bin="$1" metric="$2"
  [[ -x "$bin" ]] && strings "$bin" 2>/dev/null | grep -q "$metric"
}

if [[ -x "$REPO" ]] && has_metric_in_binary "$REPO" "loganalyzer_threat_last_sync_ts"; then
  if [[ -x "$INSTALLED" ]] && ! has_metric_in_binary "$INSTALLED" "loganalyzer_threat_last_sync_ts"; then
    echo "[grafana_metrics_smoke] UYARI: ./log-guardian guncel ama ${INSTALLED} ESKI" >&2
    echo "  systemd /usr/local/bin kullanir — once:" >&2
    echo "    sudo make install && sudo systemctl restart log-guardian-daemon log-guardian" >&2
    echo "  veya: bash scripts/metrics_reload.sh" >&2
  fi
fi

if ! curl -sf --max-time 3 "$URL" -o /tmp/lg_metrics.txt 2>/dev/null; then
  echo "[grafana_metrics_smoke] WARN: $URL erisilemiyor — log-guardian servisi calisiyor mu?" >&2
  echo "  METRICS_PORT=${PORT} — /etc/log-guardian/rules.conf icinde METRICS_PORT=9091" >&2
  echo "  systemctl status log-guardian log-guardian-daemon" >&2
  exit 0
fi

missing=0
for m in "${need[@]}"; do
  if grep -q "^${m}{" /tmp/lg_metrics.txt || grep -q "^${m} " /tmp/lg_metrics.txt; then
    echo "[OK] $m"
  else
    echo "[FAIL] $m yok — calisan servis eski binary kullaniyor olabilir" >&2
    missing=$((missing + 1))
  fi
done

rm -f /tmp/lg_metrics.txt
if [[ "$missing" -gt 0 ]]; then
  echo "" >&2
  echo "Cozum (tek komut):" >&2
  echo "  bash scripts/metrics_reload.sh" >&2
  exit 1
fi
echo "[OK] grafana_metrics_smoke — SOC metrikleri hazir"
