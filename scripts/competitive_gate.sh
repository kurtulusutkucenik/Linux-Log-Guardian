#!/usr/bin/env bash
# Rekabet kapisi — FP, import, bench, incident
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

MIN_FALCO="${FALCO_MIN_RULES:-100}"
MAX_FP="${MAX_FP_PCT:-5.0}"

fail() { echo "[competitive_gate] FAIL: $*" >&2; exit 1; }

test -f bench-vs-modsec.json || fail "bench-vs-modsec.json yok — competitive_suite calistirin"
test -f fp-report.json || fail "fp-report.json yok"

MIN_REAL_RECALL="${REAL_ATTACK_MIN_RECALL:-85}"
if [[ -f real-attack-report.json ]]; then
  python3 -c "
import json, sys
d=json.load(open('real-attack-report.json'))
r=d.get('attack_recall_pct',0)
t=float(sys.argv[1])
assert d.get('pass') and r>=t, f'real attack recall {r}% < {t}%'
" "$MIN_REAL_RECALL" || fail "real-attack-report recall < ${MIN_REAL_RECALL}%"
  echo "[competitive_gate] real attack recall OK"
else
  fail "real-attack-report.json yok — bash scripts/real_attack_suite.sh"
fi

MIN_DIST_RECALL="${DISTRIBUTED_MIN_RECALL:-85}"
if [[ -f ja3-cluster-report.json ]]; then
  python3 -c "
import json, sys
d=json.load(open('ja3-cluster-report.json'))
r=d.get('recall_pct',0)
t=float(sys.argv[1])
assert d.get('pass') and r>=t, f'distributed recall {r}% < {t}%'
" "$MIN_DIST_RECALL" || fail "ja3-cluster recall < ${MIN_DIST_RECALL}%"
  echo "[competitive_gate] distributed cluster recall OK"
fi

eps=$(python3 -c "import json; print(json.load(open('bench-vs-modsec.json'))['log_guardian']['eps'])")
[[ "${eps:-0}" -gt 0 ]] || fail "EPS=0"

fp=$(python3 -c "import json; print(json.load(open('fp-report.json'))['benign']['fp_rate_pct'])")
benign_lines=$(python3 -c "import json; print(json.load(open('fp-report.json'))['benign']['lines'])")
MIN_BENIGN="${MIN_BENIGN_LINES:-150}"
[[ "${benign_lines:-0}" -ge "$MIN_BENIGN" ]] || fail "benign corpus ${benign_lines} satir < ${MIN_BENIGN}"
awk -v f="$fp" -v m="$MAX_FP" 'BEGIN { exit (f <= m) ? 0 : 1 }' || fail "FP ${fp}% > ${MAX_FP}%"

crs_eps=$(python3 -c "import json; d=json.load(open('bench-vs-modsec.json')); print(d.get('modsecurity',{}).get('eps',0))" 2>/dev/null || echo 0)
[[ "${crs_eps:-0}" -gt 0 ]] || fail "CRS replay EPS=0 (crs-bundle.rules?)"

python3 -c "
import json
b=json.load(open('bench-vs-modsec.json'))
g=b.get('log_guardian',{}).get('latency_us_per_line',0)
m=b.get('modsecurity',{}).get('latency_us_per_line',0)
assert g>0 and m>0, 'bench latency_us_per_line eksik — bench_vs_modsec yeniden calistirin'
" || fail "bench latency alanlari yok"

test -f .cache/lineage_live/attack_tree.json || fail "lineage live snapshot yok — lineage_live_e2e"
python3 -c "
import json
t=json.load(open('.cache/lineage_live/attack_tree.json'))
ev=t[0].get('events',[])
types={e.get('type') for e in ev}
assert {'FILE_READ','EXEC_SHELL','NET_CONNECT'} <= types
" || fail "lineage event zinciri eksik"

falco_n=0
if [[ -f rules/generated-falco-host.json ]]; then
  falco_n=$(python3 -c "import json; print(json.load(open('rules/generated-falco-host.json'))['count'])")
fi
[[ "$falco_n" -ge 24 ]] || fail "Falco import $falco_n < 24"
if [[ "$falco_n" -lt "$MIN_FALCO" ]]; then
  echo "[WARN] Falco $falco_n < hedef $MIN_FALCO (macro kurallar genisletilemedi olabilir)" >&2
fi

make -s log-guardian
./log-guardian incident-sim >/dev/null || fail "incident-sim"

REQUIRE_WASM_NATIVE="${REQUIRE_WASM_NATIVE:-1}"
if [[ "$REQUIRE_WASM_NATIVE" == "1" ]]; then
  test -f wasm-status.json || fail "wasm-status.json yok — bash scripts/wasm_release.sh"
  python3 -c "
import json, sys
d = json.load(open('wasm-status.json'))
if not d.get('pass'):
    sys.exit(2)
if d.get('mode') != 'native':
    sys.exit(3)
" || {
    code=$?
    if [[ "$code" == 3 ]]; then fail "wasm mode stub — bash scripts/wasm_release.sh (Wasmtime+Cargo)"
    elif [[ "$code" == 2 ]]; then fail "wasm smoke failed (SQLi alarm yok)"
    else fail "wasm-status.json gecersiz"
    fi
  }
  wasm_mode=$(python3 -c "import json; print(json.load(open('wasm-status.json')).get('mode'))")
  echo "[competitive_gate] wasm=$wasm_mode (REQUIRE_WASM_NATIVE=1)"
elif [[ -f wasm-status.json ]]; then
  python3 -c "import json,sys; d=json.load(open('wasm-status.json')); sys.exit(0 if d.get('pass') else 1)" \
    || fail "wasm smoke failed"
  wasm_mode=$(python3 -c "import json; print(json.load(open('wasm-status.json')).get('mode','stub'))")
  echo "[competitive_gate] wasm=$wasm_mode (stub OK — dev)"
fi

if [[ -f crs-parity-report.json ]]; then
  python3 -c "
import json, sys
r=json.load(open('crs-parity-report.json'))
if not r.get('pass'):
    sys.exit(1)
print(f\"[competitive_gate] crs parity {r['guardian']['attack_recall_pct']}% parity={r['parity_pct']}%\")
" || fail "CRS parity failed"
fi

MIN_10K_RECALL="${REAL_ATTACK_10K_MIN_RECALL:-100}"
if [[ -f real-attack-report-10k.json ]]; then
  python3 -c "
import json, sys
d=json.load(open('real-attack-report-10k.json'))
r=d.get('attack_recall_pct',0)
t=float(sys.argv[1])
assert d.get('pass') and r>=t, f'10k recall {r}% < {t}%'
" "$MIN_10K_RECALL" || fail "real-attack-report-10k recall < ${MIN_10K_RECALL}%"
  echo "[competitive_gate] corpus 10K recall OK"
fi

if [[ "${SOAK_SHORT_GATE:-0}" == "1" ]]; then
  test -f soak-report.short.json || fail "soak-report.short.json yok — STABILITY=1 full_proof_pack"
  python3 -c "
import json, sys
d=json.load(open('soak-report.short.json'))
assert d.get('pass') and d.get('failures',1)==0, 'soak short failed'
" || fail "soak-report.short.json pass=False"
  echo "[competitive_gate] soak short (5m) OK"
fi

echo "[competitive_gate] OK eps=$eps fp=${fp}% falco_rules=$falco_n"
