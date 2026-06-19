#!/usr/bin/env bash
# 72h soak raporunu ozetle + dashboard kanit klasorune kopyala
#   bash scripts/publish_soak_report.sh
#   bash scripts/publish_soak_report.sh --markdown
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${SOAK_REPORT:-soak-report.json}"
OUT_DIR="${SOAK_EVIDENCE_DIR:-$ROOT/docs/evidence}"
MD="$OUT_DIR/SOAK_SUMMARY.md"

[[ -f "$REPORT" ]] || {
  echo "[publish_soak] FAIL: $REPORT yok — once soak testi bitirin" >&2
  echo "  SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start" >&2
  exit 1
}

mkdir -p "$OUT_DIR" .cache/dashboard-live 2>/dev/null || true

copy_out() {
  local src="$1" dest="$2"
  if cp -f "$src" "$dest" 2>/dev/null; then
    return 0
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    cp -f "$src" "$dest"
    return $?
  fi
  echo "[publish_soak] WARN: yazilamadi: $dest" >&2
  echo "[publish_soak] FIX: sudo chown -R \$(id -un):\$(id -gn) $OUT_DIR" >&2
  return 1
}

EVIDENCE_OK=1
copy_out "$REPORT" "$OUT_DIR/soak-report.json" || EVIDENCE_OK=0
copy_out "$REPORT" .cache/dashboard-live/soak-report.json || true
[[ -f soak-72h.log ]] && copy_out soak-72h.log "$OUT_DIR/soak-72h.log" 2>/dev/null || true

python3 - "$REPORT" "$MD" "$ROOT" <<'PY'
import json, sys
from pathlib import Path
from datetime import datetime, timezone

report_path, md_path_s, root_s = sys.argv[1:4]
r = json.loads(Path(report_path).read_text())
lines = [
    "# Soak test ozeti",
    "",
    f"Uretim: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    "",
    "| Alan | Deger |",
    "|------|-------|",
]
for k in ("duration_hours", "pass", "pass_strict", "pass_operational", "failures", "skips", "grace_sec", "max_rss_kb", "rss_mb_max", "alerts_total", "restarts"):
    if k in r:
        lines.append(f"| {k} | {r[k]} |")
notes = r.get("notes") or r.get("note")
if notes:
    lines.extend(["", f"Not: {notes}"])
lines.append("")
lines.append("Ham JSON: `docs/evidence/soak-report.json`")
md_path = Path(md_path_s)
try:
    md_path.write_text(chr(10).join(lines) + chr(10), encoding="utf-8")
    print(f"[OK] {len(lines)} satir -> {md_path}")
except OSError as e:
    alt = Path(root_s) / ".cache/dashboard-live/SOAK_SUMMARY.md"
    alt.write_text(chr(10).join(lines) + chr(10), encoding="utf-8")
    print(f"[WARN] {md_path} yazilamadi ({e}) -> {alt}", file=__import__('sys').stderr)
PY

if [[ "$EVIDENCE_OK" -eq 1 ]]; then
  echo "[OK] publish_soak_report"
  echo "  JSON: $OUT_DIR/soak-report.json"
  echo "  MD:   $MD"
else
  echo "[OK] publish_soak_report (kismi — .cache/dashboard-live guncel)"
  echo "  JSON: .cache/dashboard-live/soak-report.json"
  echo "  FIX:  sudo chown -R \$(id -un):\$(id -gn) $OUT_DIR && bash scripts/publish_soak_report.sh"
fi
if [[ "${1:-}" == "--markdown" ]]; then
  cat "$MD"
fi
