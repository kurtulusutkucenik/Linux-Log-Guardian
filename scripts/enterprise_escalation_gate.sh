#!/usr/bin/env bash
# Sprint AH — Enterprise escalation playbook + operatör kapıları
#   bash scripts/enterprise_escalation_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${ENTERPRISE_ESCALATION_GATE_REPORT:-enterprise-escalation-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/enterprise_escalation_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[enterprise_escalation_gate] FAIL: $*" >&2
  exit 1
}

echo "=== enterprise_escalation_gate (Sprint AH) ==="

DOC="$ROOT/docs/ENTERPRISE_ESCALATION.md"
[[ -f "$DOC" ]] || fail "ENTERPRISE_ESCALATION.md yok"

REQUIRED_SCRIPTS=(
  scripts/post_install_verify.sh
  scripts/telegram_soc_gate.sh
  scripts/telegram_operator_undo.sh
  scripts/edge_protection_gate.sh
  scripts/grafana_parity_gate.sh
  scripts/website_preview_gate.sh
  scripts/website_live_gate.sh
  scripts/release_ready_gate.sh
  scripts/demo_rehearsal_gate.sh
  scripts/presentation_ship_gate.sh
  scripts/demo_video_gate.sh
  scripts/github_ship_gate.sh
  scripts/laptop_core_gate.sh
)
for s in "${REQUIRED_SCRIPTS[@]}"; do
  [[ -x "$ROOT/$s" || -f "$ROOT/$s" ]] || fail "eksik: $s"
done

python3 - "$REPORT" "$DOC" "$ROOT/docs/ENTERPRISE_SUPPORT.md" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path, esc_path, support_path = sys.argv[1:4]
esc = Path(esc_path).read_text(encoding="utf-8")
support = Path(support_path).read_text(encoding="utf-8")

sections = ["P1", "P2", "P3", "P4", "Telegram", "SIGUSR2", "edge_protection_gate"]
missing = [s for s in sections if s not in esc]
link_ok = "ENTERPRISE_ESCALATION.md" in support

reasons = []
if missing:
    reasons.append("doc_sections:" + ",".join(missing))
if not link_ok:
    reasons.append("support_link_missing")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "doc_sections": len(sections) - len(missing),
    "support_linked": link_ok,
    "operator_scripts": 13,
    "script": "scripts/enterprise_escalation_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
if not ok:
    sys.exit(1)
print(json.dumps(out, indent=2))
PY

# Hafif operatör kapıları (laptop — root gerektirmez)
gates_ok=0
gates_total=3
bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1 && gates_ok=$((gates_ok + 1)) || true
bash "$ROOT/scripts/edge_protection_gate.sh" >/dev/null 2>&1 && gates_ok=$((gates_ok + 1)) || true
bash "$ROOT/scripts/grafana_parity_gate.sh" >/dev/null 2>&1 && gates_ok=$((gates_ok + 1)) || true

python3 - "$REPORT" "$gates_ok" "$gates_total" <<'PY'
import json, sys
from pathlib import Path
p, ok_n, total = Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
d = json.loads(p.read_text(encoding="utf-8"))
d["live_gates_ok"] = ok_n
d["live_gates_total"] = total
d["pass"] = d.get("pass") and ok_n >= 2
if ok_n < 2:
    d["fail_reason"] = (d.get("fail_reason") or "") + f"; live_gates={ok_n}/{total}"
    d["pass"] = False
p.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
if not d["pass"]:
    sys.exit(1)
PY

echo "[OK] enterprise_escalation_gate — doc + live_gates=$(python3 -c "import json; d=json.load(open('$REPORT')); print(f\"{d['live_gates_ok']}/{d['live_gates_total']}\")")"
