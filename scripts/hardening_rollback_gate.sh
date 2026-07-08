#!/usr/bin/env bash
# Hardening geri alma hazirligi — salt okunur kapı (VPS/laptop isleyisi bozmaz)
#   bash scripts/hardening_rollback_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${HARDENING_ROLLBACK_GATE_REPORT:-hardening-rollback-gate-report.json}"

fail_reason=""
pass=true
checks=()

add() {
  local id="$1" ok="$2" note="${3:-}"
  checks+=("$id:$ok:$note")
  [[ "$ok" == "1" ]] || pass=false
}

echo "=== hardening_rollback_gate ==="

[[ -f "$ROOT/docs/HARDENING_ROLLBACK.md" ]] && add doc 1 || add doc 0 "HARDENING_ROLLBACK.md yok"
[[ -x "$ROOT/scripts/backup_operator_secrets.sh" ]] && add backup_script 1 || add backup_script 0
[[ -x "$ROOT/scripts/apply_internet_facing_hardening.sh" ]] && add apply_script 1 || add apply_script 0
[[ -x "$ROOT/scripts/disable_enterprise_soar_api.sh" ]] && add soar_disable 1 || add soar_disable 0

if grep -qE '\.bak\.' "$ROOT/scripts/apply_internet_facing_hardening.sh" 2>/dev/null; then
  add apply_auto_backup 1
else
  add apply_auto_backup 0 "apply script .bak yedek yok"
fi

if [[ -f "$HOME/.config/log-guardian/operator-secrets.txt" ]] \
  || ls /etc/log-guardian/env.bak.* >/dev/null 2>&1 \
  || ls /etc/log-guardian/rules.conf.bak.* >/dev/null 2>&1; then
  add operator_backup_exists 1 "operator/env yedek mevcut"
else
  add operator_backup_exists 1 "laptop — yedek henuz yok (on_apply olusur)"
fi

# Internet-facing demo parola algisi (dry-run, degisiklik yok)
if out=$(LG_FORCE_INTERNET_FACING=1 bash "$ROOT/scripts/post_install_verify.sh" 2>&1); then
  if echo "$out" | grep -qiE 'dashboard demo parola|demo parola'; then
    add demo_password_detect 1 "LG_FORCE ile demo parola FAIL"
  else
    add demo_password_detect 0 "demo parola FAIL metni yok"
  fi
else
  if echo "$out" | grep -qiE 'dashboard demo parola|demo parola'; then
    add demo_password_detect 1 "LG_FORCE ile demo parola FAIL"
  else
    add demo_password_detect 0 "post_install_verify cikti belirsiz"
  fi
fi

python3 - "$REPORT" "$pass" "$fail_reason" "${checks[@]}" <<'PY'
import json, datetime, sys
from pathlib import Path

report = Path(sys.argv[1])
passed = sys.argv[2] == "true"
fail_reason = sys.argv[3]
checks = []
for spec in sys.argv[4:]:
    parts = spec.split(":", 2)
    checks.append({
        "id": parts[0],
        "ok": parts[1] == "1",
        "note": parts[2] if len(parts) > 2 else "",
    })
doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": passed,
    "fail_reason": fail_reason or None,
    "checks": checks,
    "doc": "docs/HARDENING_ROLLBACK.md",
    "script": "scripts/hardening_rollback_gate.sh",
}
report.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY

for spec in "${checks[@]}"; do
  IFS=: read -r id ok note <<<"$spec"
  if [[ "$ok" == "1" ]]; then
    echo "[OK] $id${note:+ — $note}"
  else
    echo "[FAIL] $id${note:+ — $note}" >&2
    fail_reason="${fail_reason:-$id}"
  fi
done

if [[ "$pass" == true ]]; then
  echo "[OK] hardening_rollback_gate"
  exit 0
fi
echo "[FAIL] hardening_rollback_gate — ${fail_reason:-check}" >&2
exit 1
