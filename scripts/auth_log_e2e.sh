#!/usr/bin/env bash
# auth.log / sshd satirlari parse + brute esigi (nginx disi ingest)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_BIN="${LG_BIN:-./log-guardian}"
LOG="${LG_AUTH_LOG:-$ROOT/test_auth.log}"
RULES="${LG_RULES:-$ROOT/rules.conf}"

fail() { echo "[auth_log_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ -x "$LG_BIN" ]] || fail "log-guardian yok — make -j\$(nproc)"
[[ -f "$LOG" ]] || fail "$LOG yok"

echo "=== auth_log_e2e ==="

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export LOG_GUARDIAN_SKIP_IPC=1
out=$(env LOGANALYZER_PASSWORD="$LOGANALYZER_PASSWORD" LOG_GUARDIAN_SKIP_IPC=1 \
  "$LG_BIN" "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)

pe=$(echo "$out" | grep -o '"parse_errors"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
tl=$(echo "$out" | grep -o '"total_lines"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
ui=$(echo "$out" | grep -o '"unique_ips"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
at=$(echo "$out" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)

[[ "${pe:-0}" -eq 0 ]] || fail "parse_errors=$pe"
[[ "${tl:-0}" -ge 3 ]] || fail "total_lines=$tl (beklenen >=3)"
ok "parse auth/sshd ($tl satir, 0 hata)"

[[ "${ui:-0}" -ge 2 ]] || fail "unique_ips=$ui (sshd + accepted beklenen >=2)"
[[ "${at:-0}" -ge 3 ]] || fail "alerts_total=$at (brute esigi beklenen >=3)"
ok "brute SSH esigi (unique_ips=$ui alerts=$at)"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "total_lines": int("${tl:-0}"),
    "parse_errors": int("${pe:-0}"),
    "unique_ips": int("${ui:-0}"),
    "alerts_total": int("${at:-0}"),
    "log": "${LOG}",
}
Path("${ROOT}/auth-log-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
PY

echo "[OK] auth_log_e2e"
