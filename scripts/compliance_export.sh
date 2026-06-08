#!/usr/bin/env bash
# Tier 2 #7 — PCI/SOC2/KVKK JSON + PDF export
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian 2>/dev/null || true
bash scripts/guardian_status_export.sh 2>/dev/null || true
bash scripts/fp_report.sh 2>/dev/null || true

python3 scripts/compliance_build.py -o compliance-report.json

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
  "$PDF_PY" scripts/compliance_pdf.py -i compliance-report.json -o compliance-report.pdf
else
  echo "[INFO] PDF atlandi — .venv-compliance veya: pip install fpdf2"
fi

echo "[OK] compliance_export"
