#!/usr/bin/env bash
# T2 TLS kaniti — JA3 live probe + rapor guncelleme
#   sudo bash scripts/nginx_tls_local_setup.sh   # ilk kurulum
#   sudo systemctl restart log-guardian-daemon log-guardian
#   bash scripts/t2_tls_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== t2_tls_proof ==="

if ! bash scripts/check_nginx_tls_443.sh; then
  echo "[t2_tls_proof] TLS hazir degil — setup atlandi" >&2
  exit 1
fi

LIVE=1 bash scripts/ja3_cluster_proof.sh
bash scripts/competitive_proof.sh 2>/dev/null || true
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

python3 - <<'PY'
import json
from pathlib import Path

p = Path("ja3-cluster-report.json")
if not p.is_file():
    raise SystemExit("ja3-cluster-report.json yok")
live = json.loads(p.read_text()).get("live") or {}
ok = live.get("pass") is True
print(f"[t2_tls_proof] tls_ready={live.get('tls_ready')} ja3_pass={ok}")
if not ok:
    raise SystemExit(1)
PY

echo "[OK] t2_tls_proof tamam -> ja3-cluster-report.json"
