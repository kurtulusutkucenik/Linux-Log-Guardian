#!/usr/bin/env bash
# Kurulum / sunum kapilari -> ops-gate-report.json (website + competitive-proof)
#   bash scripts/ops_gate_report.sh           # hizli (sudo yok)
#   bash scripts/ops_gate_report.sh --full    # + vm_demo_gate + website_deploy_gate
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${OPS_GATE_REPORT:-$ROOT/ops-gate-report.json}"
FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

parse_summary() {
  local out="$1"
  local fail warn
  fail=$(echo "$out" | sed -n 's/.*FAIL: \([0-9]*\).*/\1/p' | tail -1)
  warn=$(echo "$out" | sed -n 's/.*WARN: \([0-9]*\).*/\1/p' | tail -1)
  if [[ -z "$fail" ]]; then
    fail=$(echo "$out" | grep -c '^\[FAIL\]' 2>/dev/null || true)
    [[ -z "$fail" || "$fail" == "0" ]] && fail=$(echo "$out" | grep -c '\[FAIL\]' 2>/dev/null || true)
  fi
  fail="${fail:-0}"
  warn="${warn:-0}"
  echo "$fail $warn"
}

append_gate_json() {
  local tmp
  tmp="$(mktemp)"
  printf '%s' "$1" > "$tmp"
  python3 - "$OUT" "$tmp" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

out_path = Path(sys.argv[1])
gate = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
Path(sys.argv[2]).unlink(missing_ok=True)
doc = {"date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "pass": True, "gates": []}
if out_path.is_file():
    try:
        doc = json.loads(out_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        pass
gates = [g for g in doc.get("gates", []) if g.get("id") != gate["id"]]
gates.append(gate)
doc["gates"] = gates
doc["pass"] = all(g.get("pass") for g in gates)
doc["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
out_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(gate["id"], "pass=" + str(gate["pass"]))
PY
}

run_gate() {
  local id="$1" script="$2"
  shift 2
  local -a extra=()
  while [[ $# -gt 4 && "$1" == --* ]]; do
    extra+=("$1")
    shift
  done
  local title_tr="$1" title_en="$2" purpose_tr="$3" purpose_en="$4"
  local out ec=0
  out="$(bash "$ROOT/$script" "${extra[@]}" 2>&1)" || ec=$?
  read -r fail warn <<< "$(parse_summary "$out")"
  local pass=false
  [[ "$ec" -eq 0 && "$fail" == "0" ]] && pass=true
  local verdict_tr="FAIL: ${fail} · WARN: ${warn}"
  local verdict_en="$verdict_tr"
  [[ "$pass" == false ]] && verdict_tr="Kapı kırmızı — $verdict_tr"
  [[ "$pass" == false ]] && verdict_en="Gate failed — $verdict_en"
  local gate_json
  gate_json="$(
    GATE_ID="$id" GATE_SCRIPT="$script" GATE_PASS="$pass" GATE_FAIL="$fail" GATE_WARN="$warn" \
      GATE_TITLE_TR="$title_tr" GATE_TITLE_EN="$title_en" \
      GATE_PURPOSE_TR="$purpose_tr" GATE_PURPOSE_EN="$purpose_en" \
      GATE_VERDICT_TR="$verdict_tr" GATE_VERDICT_EN="$verdict_en" \
      python3 - <<'PY'
import json, os
gate = {
    "id": os.environ["GATE_ID"],
    "script": os.environ["GATE_SCRIPT"],
    "pass": os.environ["GATE_PASS"] == "true",
    "fail": int(os.environ["GATE_FAIL"]),
    "warn": int(os.environ["GATE_WARN"]),
    "title": os.environ["GATE_TITLE_TR"],
    "titleEn": os.environ["GATE_TITLE_EN"],
    "purpose": os.environ["GATE_PURPOSE_TR"],
    "purposeEn": os.environ["GATE_PURPOSE_EN"],
    "verdict": os.environ["GATE_VERDICT_TR"],
    "verdictEn": os.environ["GATE_VERDICT_EN"],
    "metrics": [
        {"label": "FAIL", "value": os.environ["GATE_FAIL"]},
        {"label": "WARN", "value": os.environ["GATE_WARN"]},
    ],
    "group": "gate",
}
print(json.dumps(gate, ensure_ascii=False))
PY
  )"
  append_gate_json "$gate_json"
}

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
p = Path("$OUT")
p.write_text(json.dumps({
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "pass": True,
    "gates": [],
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

echo "=== ops_gate_report ==="

run_gate "post-install-verify" "scripts/post_install_verify.sh" \
  "Kurulum kapısı — servis, IPC, API fail-closed" \
  "Install gate — services, IPC, API fail-closed" \
  "systemd, --health, metrics :9091, API_BIND ve nginx formatının yeşil matrisi." \
  "systemd, --health, metrics :9091, API_BIND and nginx format green matrix."

run_gate "local-security-audit" "scripts/local_security_audit.sh" \
  "Yerel güvenlik denetimi — IPC, JWT, token sızıntısı" \
  "Local security audit — IPC, JWT, secret hygiene" \
  "Laptop/prod öncesi güvenlik script matrisi; demo parola laptop'ta WARN kabul." \
  "Pre-prod security script matrix; demo password WARN on laptop is OK."

run_gate "api-fail-closed" "scripts/api_fail_closed_test.sh" \
  "API fail-closed — tokensiz istek 403" \
  "API fail-closed — unauthenticated requests return 403" \
  "Ban/consult/metrics uçları token olmadan reddedilir." \
  "Ban/consult/metrics endpoints reject requests without a token."

if [[ "$FULL" -eq 1 ]]; then
  run_gate "vm-demo-gate" "scripts/vm_demo_gate.sh" --verify-only \
    "VM demo kapısı — post_install 0 FAIL" \
    "VM demo gate — post_install 0 FAIL" \
    "VirtualBox/VPS sunum öncesi son kontrol." \
    "Final check before VirtualBox/VPS demo."
fi

n="$(python3 -c "import json; print(len(json.load(open('$OUT'))['gates']))")"
echo "[OK] ops_gate_report -> $OUT ($n gate)"
exit 0
