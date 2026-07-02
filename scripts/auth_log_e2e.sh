#!/usr/bin/env bash
# auth.log / sshd satirlari parse + brute esigi (nginx disi ingest)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()

LOG="${LG_AUTH_LOG:-$ROOT/test_auth.log}"

fail() { echo "[auth_log_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

ensure_e2e_log_fixture "$ROOT" auth_sshd "$LOG" \
  || fail "$LOG yok — tests/fixtures/auth_sshd.fixture eksik"

LG_BIN="$(resolve_lg_e2e_bin "$ROOT")" || fail "log-guardian yok — make veya vm_build_binary"
RULES="$(resolve_lg_e2e_rules "$ROOT")" || fail "rules.conf yok — repo veya /etc/log-guardian"

echo "=== auth_log_e2e ==="
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
[[ "${tl:-0}" -ge 6 ]] || fail "total_lines=$tl (beklenen >=6)"
ok "parse auth/sshd ($tl satir, 0 hata)"

[[ "${ui:-0}" -ge 4 ]] || fail "unique_ips=$ui (sshd + disconnect beklenen >=4)"
[[ "${at:-0}" -ge 6 ]] || fail "alerts_total=$at (brute/disconnect beklenen >=6)"
ok "brute SSH + disconnect (unique_ips=$ui alerts=$at)"

python3 - "$LOG" "${ROOT}/auth-log-report.json" "${tl:-0}" "${pe:-0}" "${ui:-0}" "${at:-0}" <<'PY'
import json, re, sys
from datetime import datetime, timezone
from pathlib import Path

log = Path(sys.argv[1])
out_path = Path(sys.argv[2])
tl, pe, ui, at = (int(sys.argv[i]) for i in range(3, 7))
ips = []
for ln in log.read_text(encoding="utf-8").splitlines():
    m = re.search(
        r"(?: from |Connection closed by |Received disconnect from |Disconnected from (?:authenticating user \S+ )?)"
        r"(\d{1,3}(?:\.\d{1,3}){3})",
        ln,
    )
    if m:
        ips.append(m.group(1))
sample = sorted(set(ips))[:12]
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "total_lines": tl,
    "parse_errors": pe,
    "unique_ips": ui,
    "alerts_total": at,
    "sample_ips": sample,
    "log": str(log),
}
out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] auth_log_e2e"
