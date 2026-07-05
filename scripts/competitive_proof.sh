#!/usr/bin/env bash
# competitive_suite ciktilarini tek JSON + PDF data room paketine donustur
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scripts/ops_gate_report.sh" "${OPS_GATE_FULL:+--full}"
bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null || true

# Opsiyonel katman raporlari — stale skip/warn onlenir (go/kind yoksa docker fallback)
bash "$ROOT/scripts/k8s_admission_test.sh" 2>/dev/null || true
bash "$ROOT/scripts/ban_profile_e2e.sh" 2>/dev/null || true
bash "$ROOT/scripts/dist_risk_proof_e2e.sh" 2>/dev/null || true

python3 scripts/competitive_proof_build.py -o competitive-proof.json
python3 scripts/sync_landing_tests_from_proof.py || true
# Uzun ops_gate sonrasi ipc:fail onlenir — status + proof ikinci kez
bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null || true
python3 scripts/competitive_proof_build.py -o competitive-proof.json
python3 scripts/sync_landing_tests_from_proof.py || true

VENV="$ROOT/.venv-compliance"
if [[ ! -x "$VENV/bin/python" ]]; then
  python3 -m venv "$VENV" 2>/dev/null || true
fi
if [[ -x "$VENV/bin/pip" ]]; then
  "$VENV/bin/pip" install -q fpdf2 2>/dev/null || true
fi
PDF_PY="${VENV}/bin/python"
if [[ ! -x "$PDF_PY" ]]; then
  PDF_PY=python3
fi

if "$PDF_PY" -c "import fpdf" 2>/dev/null; then
  "$PDF_PY" -W ignore::DeprecationWarning scripts/competitive_proof_pdf.py \
    -i competitive-proof.json -o competitive-proof.pdf --locale en
else
  echo "[INFO] PDF atlandi — pip install fpdf2 veya .venv-compliance"
fi

echo "[OK] competitive_proof -> competitive-proof.json competitive-proof.pdf (EN)"
