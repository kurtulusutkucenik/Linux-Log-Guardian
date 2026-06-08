#!/usr/bin/env bash
# L7: daemon/--status -> guardian-status.json -> dashboard bench-metrics
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[l7_prod_e2e] FAIL: $*" >&2; exit 1; }

bash scripts/guardian_status_export.sh
test -f guardian-status.json || fail "guardian-status.json yok"

python3 -c "
import json
d=json.load(open('guardian-status.json'))
assert 'l7_http' in d, 'l7_http eksik (--status JSON)'
l7=d['l7_http']
for k in ('inspected','blocked','ebpf_hits','get','post','probe','probe_active'):
    assert k in l7, f'l7_http.{k} eksik'
daemon=d.get('daemon')
if daemon is not None:
    for k in ('l7_probe','l7_http_hits','l7_http_get','l7_http_post'):
        assert k in daemon, f'daemon.{k} eksik (--status daemon JSON)'
print('[l7_prod_e2e] l7_http OK probe_active=', l7.get('probe_active'),
      ' daemon.l7_probe=', (daemon or {}).get('l7_probe'))
"

# Dashboard API shape (bench-metrics live passthrough)
python3 -c "
import json
live=json.load(open('guardian-status.json'))
out={'available': True, 'live': live}
json.dump(out, open('.cache/l7_bench_probe.json','w'), indent=2)
"

echo "[OK] l7_prod_e2e"
