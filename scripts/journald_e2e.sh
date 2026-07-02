#!/usr/bin/env bash
# P4 #15 — journald export (short-iso + usec) + sudo rhost spike ingest
#   bash scripts/journald_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()

LOG="${LG_JOURNALD_LOG:-$ROOT/test_journald.log}"

fail() { echo "[journald_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

ensure_e2e_log_fixture "$ROOT" journald_export "$LOG" \
  || fail "$LOG yok — tests/fixtures/journald_export.fixture eksik"

LG_BIN="$(resolve_lg_e2e_bin "$ROOT")" || fail "log-guardian yok — make veya vm_build_binary"
RULES="$(resolve_lg_e2e_rules "$ROOT")" || fail "rules.conf yok — repo veya /etc/log-guardian"

echo "=== journald_e2e ==="
echo "  bin=$LG_BIN rules=$RULES"

prepare_lg_replay_auth
export LOG_GUARDIAN_SKIP_IPC=1
out=$(env LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}" LOG_GUARDIAN_SKIP_IPC=1 \
  "$LG_BIN" "${LG_AUTH_ARGS[@]}" "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)

pe=$(echo "$out" | grep -o '"parse_errors"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
tl=$(echo "$out" | grep -o '"total_lines"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
ui=$(echo "$out" | grep -o '"unique_ips"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
at=$(echo "$out" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)

[[ "${pe:-0}" -eq 0 ]] || fail "parse_errors=$pe"
[[ "${tl:-0}" -ge 7 ]] || fail "total_lines=$tl (beklenen >=7)"
ok "journald short-iso + usec ($tl satir, 0 hata)"

[[ "${ui:-0}" -ge 5 ]] || fail "unique_ips=$ui (sshd+sudo rhost beklenen >=5)"
[[ "${at:-0}" -ge 7 ]] || fail "alerts_total=$at (spike beklenen >=7)"
ok "sudo rhost spike + sshd brute (unique_ips=$ui alerts=$at)"

python3 - "$LOG" "${ROOT}/journald-ingest-report.json" "${tl:-0}" "${pe:-0}" "${ui:-0}" "${at:-0}" <<'PY'
import json, re, sys
from datetime import datetime, timezone
from pathlib import Path

log = Path(sys.argv[1])
out_path = Path(sys.argv[2])
tl, pe, ui, at = (int(sys.argv[i]) for i in range(3, 7))
ips = []
sudo_n = 0
for ln in log.read_text(encoding="utf-8").splitlines():
    if "sudo[" in ln and "rhost=" in ln:
        sudo_n += 1
    for pat in (
        r" from (\d{1,3}(?:\.\d{1,3}){3})",
        r"rhost=(\d{1,3}(?:\.\d{1,3}){3})",
    ):
        m = re.search(pat, ln)
        if m:
            ips.append(m.group(1))
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "total_lines": tl,
    "parse_errors": pe,
    "unique_ips": ui,
    "alerts_total": at,
    "sudo_lines": sudo_n,
    "sample_ips": sorted(set(ips))[:12],
    "log": str(log),
    "formats": ["short-iso-usec", "syslog-month", "sudo-rhost"],
    "script": "scripts/journald_e2e.sh",
}
out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] journald_e2e"
