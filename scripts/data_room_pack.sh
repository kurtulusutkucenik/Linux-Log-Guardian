#!/usr/bin/env bash
# Kanit artefaktlarini data-room/ klasorune toplar (acik kaynak benchmark paketi)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="${DATA_ROOM_DIR:-$ROOT/data-room}"
ZIP="${DATA_ROOM_ZIP:-$ROOT/data-room.zip}"

ARTIFACTS=(
  competitive-proof.json
  competitive-proof.pdf
  real-attack-report.json
  real-attack-report-10k.json
  live-attack-report.json
  ja3-cluster-report.json
  ja3-cluster-ban-live.json
  fp-cluster-trust-report.json
  lineage-live-report.json
  nginx-inline-consult-report.json
  owasp-corpus-report.json
  tr-hosting-corpus-report.json
  threat-intel-sync-report.json
  bench-vs-modsec.json
  fp-report.json
  crs-parity-report.json
  bench-ban-latency.json
  tenant-isolation-report.json
  guardian-status.json
  compliance-report.json
  soak-report.json
  soak-report.short.json
  incidents-snapshot.json
  wasm-status.json
)

mkdir -p "$OUT"

copied=0
missing=()
for f in "${ARTIFACTS[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    cp -f "$ROOT/$f" "$OUT/$f"
    copied=$((copied + 1))
    echo "[data_room] + $f"
  else
    missing+=("$f")
  fi
done

python3 - "$OUT" "${missing[@]}" <<'PY'
import json, sys, datetime
from pathlib import Path

out = Path(sys.argv[1])
missing = sys.argv[2:]
files = []
for p in sorted(out.iterdir()):
    if p.is_file() and p.name != "MANIFEST.json":
        st = p.stat()
        files.append({
            "name": p.name,
            "bytes": st.st_size,
            "modified": datetime.datetime.fromtimestamp(st.st_mtime, datetime.timezone.utc).isoformat(),
        })

manifest = {
    "product": "Linux Log Guardian",
    "generated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "purpose": "Acik kaynak kanit paketi — benchmark, FP, CRS parite, ban gecikmesi",
    "files": files,
    "missingOnDisk": missing,
    "quickstart": "docs/QUICKSTART_NGINX.md",
    "runSuite": "bash scripts/competitive_suite.sh",
    "runSprintA": "bash scripts/sprint_a.sh",
}
(out / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"[data_room] MANIFEST.json ({len(files)} files, {len(missing)} missing upstream)")
PY

cat > "$OUT/README.txt" <<'EOF'
Linux Log Guardian — Kanit Paketi (data-room)
=============================================

Otomatik uretim: bash scripts/data_room_pack.sh
Tam yenileme:    bash scripts/sprint_a.sh

Dosyalar:
  competitive-proof.pdf   — Olculebilir kanit ozeti (FP, CRS, ban latency)
  competitive-proof.json — Birlesik skor karti
  fp-report.json          — False-positive orani
  crs-parity-report.json  — OWASP CRS paritesi
  bench-ban-latency.json  — Kernel ban gecikmesi (ms)
  lineage-live-report.json — eBPF attack tree zinciri kaniti
  fp-cluster-trust-report.json — FP learn x JA3 cluster
  soak-report.json        — Uzun kosu stabilitesi

Lisans: MIT — docs/QUICKSTART_NGINX.md
EOF

if command -v zip >/dev/null 2>&1; then
  rm -f "$ZIP"
  (cd "$OUT" && zip -qr "$ZIP" .)
  echo "[data_room] -> $ZIP ($(wc -c < "$ZIP" | tr -d ' ') bytes)"
fi

echo "[data_room] OK -> $OUT ($copied artifacts)"
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[data_room] eksik (normal): ${missing[*]}"
fi
