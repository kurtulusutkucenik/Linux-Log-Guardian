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
# Meta-gate kartlari kendi gate script'lerinde dogrulanir; burada dongusel FAIL onlenir.
META_GATES = {
    "github-ship-gate",
    "laptop-core-gate",
    "morning-operator-gate",
    "presentation-ship-gate",
    "release-ready-gate",
    "website-preview-gate",
}
vt = p.get("validationTests") or []
vt_core = [t for t in vt if t.get("id") not in META_GATES]
if vt_core:
    pn = sum(1 for t in vt_core if t.get("status") == "pass")
    n = len(vt_core)
    print(
        f"[OK] validationTests core {pn}/{n} pass"
        if pn == n
        else f"[FAIL] validationTests core {pn}/{n} pass"
    )
    if pn < n:
        for t in vt_core:
            if t.get("status") != "pass":
                print(f"  [FAIL] {t.get('id')}: {t.get('verdict', '')[:80]}")
        sys.exit(1)
    meta_fail = sum(1 for t in vt if t.get("id") in META_GATES and t.get("status") != "pass")
    if meta_fail:
        print(f"[OK] validationTests meta {len(META_GATES) - meta_fail}/{len(META_GATES)} (bootstrap — proof_gate_recovery.sh)")
PY
fi

echo ""
echo "=== Zincir kapilari ==="
if [[ -f docs-consistency-gate-report.json ]]; then
  json_pass "docs-consistency-gate-report.json"
else
  warn "opsiyonel yok: docs-consistency-gate-report.json — bash scripts/release_ready_gate.sh"
fi

if [[ "${SKIP_FLEET:-0}" == "1" ]]; then
  if [[ -f vm-fleet-gate-report.json ]]; then
    fleet_skip="$(python3 -c "import json;d=json.load(open('vm-fleet-gate-report.json'));print(d.get('skipped',False))" 2>/dev/null || echo False)"
    fleet_pass="$(python3 -c "import json;d=json.load(open('vm-fleet-gate-report.json'));print(d.get('pass',False))" 2>/dev/null || echo False)"
    if [[ "$fleet_skip" == "True" ]] || [[ "$fleet_pass" == "True" ]]; then
      ok "vm-fleet-gate-report.json skipped/pass (SKIP_FLEET=1)"
    else
      warn "vm-fleet-gate-report.json pass=False — rutin ship: SKIP_FLEET=1; tam filo: WITH_FLEET=1"
    fi
  else
    warn "vm-fleet-gate-report.json yok — SKIP_FLEET=1 rutin laptop"
  fi
elif [[ -f vm-fleet-gate-report.json ]]; then
  json_pass "vm-fleet-gate-report.json"
else
  warn "opsiyonel yok: vm-fleet-gate-report.json — bash scripts/vm_fleet_gate.sh"
fi
if [[ -f website-live-gate-report.json ]]; then
  wl="$(python3 -c "import json;print(json.load(open('website-live-gate-report.json')).get('pass'))" 2>/dev/null || echo "")"
  if [[ "$wl" == "True" ]]; then
    ok "website-live-gate-report.json pass=True"
  else
    warn "website-live-gate pass=False — LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh"
  fi
else
  warn "website-live-gate-report.json yok — bash scripts/website_live_gate.sh"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] release_ready_check — yerel kanit paketi hazir"
  echo "       Zincir: bash scripts/release_ready_gate.sh"
  exit 0
fi
echo "[FAIL] release_ready_check — eksik veya basarisiz kanit"
exit 1
