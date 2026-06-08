#!/usr/bin/env bash
# GitHub release oncesi hizli dogrulama — artefakt + competitive-proof pass
#   bash scripts/release_ready_check.sh
#   REQUIRE_STABILITY=1 bash scripts/release_ready_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*" >&2; fail=1; }
warn() { echo "[WARN] $*" >&2; }

need_file() {
  if [[ -f "$1" ]]; then
    ok "$1"
  else
    bad "eksik dosya: $1"
  fi
}

json_pass() {
  local file="$1" key="${2:-pass}"
  if [[ ! -f "$file" ]]; then
    bad "eksik JSON: $file"
    return
  fi
  local v
  v="$(python3 -c "import json;print(json.load(open('$file')).get('$key'))" 2>/dev/null || echo "")"
  if [[ "$v" == "True" ]]; then
    ok "$file $key=True"
  else
    bad "$file $key=$v (beklenen True)"
  fi
}

json_recall() {
  local file="$1" min="${2:-100}"
  if [[ ! -f "$file" ]]; then
    bad "eksik recall: $file"
    return
  fi
  local r
  r="$(python3 -c "import json;d=json.load(open('$file'));print(d.get('attack_recall_pct',0))" 2>/dev/null || echo 0)"
  if python3 -c "import sys; sys.exit(0 if float('$r') >= float('$min') else 1)"; then
    ok "$file recall=${r}%"
  else
    bad "$file recall=${r}% (min ${min}%)"
  fi
}

echo "=== release_ready_check ==="

need_file "competitive-proof.pdf"
need_file "competitive-proof.json"
need_file "release-pack.zip"
need_file "data-room.zip"
need_file "real-attack-report.json"
need_file "real-attack-report-10k.json"
need_file "release-pack/RELEASE_NOTES.md"

json_pass "competitive-proof.json"
json_recall "real-attack-report.json"
json_recall "real-attack-report-10k.json"

for f in owasp-corpus-report.json tr-hosting-corpus-report.json threat-intel-sync-report.json \
  ja3-cluster-report.json ja3-cluster-ban-live.json fp-cluster-trust-report.json \
  lineage-live-report.json nginx-inline-consult-report.json live-attack-report.json; do
  if [[ -f "$f" ]]; then
    json_pass "$f"
  else
    warn "opsiyonel yok: $f"
  fi
done

if [[ -f soak-report.short.json ]]; then
  json_pass "soak-report.short.json"
elif [[ "${REQUIRE_STABILITY:-0}" == "1" ]]; then
  bad "soak-report.short.json yok (REQUIRE_STABILITY=1)"
else
  warn "soak-report.short.json yok — STABILITY=1 full_proof_pack onerilir"
fi

if [[ -f competitive-proof.json ]]; then
  python3 <<'PY' || fail=1
import json, sys
p = json.load(open("competitive-proof.json"))
km = (p.get("versusCompetitors") or {}).get("killerMetrics") or {}
checks = [
    ("real_attack_recall_pct", 100),
    ("real_attack_10k_recall_pct", 100),
    ("distributed_recall_pct", 100),
    ("crs_parity_pct", 100),
]
for k, mn in checks:
    v = km.get(k)
    if v is None:
        print(f"[WARN] killerMetrics.{k} yok")
        continue
    if float(v) < mn:
        print(f"[FAIL] killerMetrics.{k}={v} (min {mn})")
        sys.exit(1)
    print(f"[OK] killerMetrics.{k}={v}")
if km.get("soak_short_pass") is True:
    print("[OK] killerMetrics.soak_short_pass=True")
PY
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] release_ready_check — yerel kanit paketi hazir (18 test raporu)"
  echo "       GitHub: 18-21 Haz gecesi — gh release create vX.Y.Z release-pack.zip competitive-proof.pdf"
  exit 0
fi
echo "[FAIL] release_ready_check — eksik veya basarisiz kanit"
exit 1
