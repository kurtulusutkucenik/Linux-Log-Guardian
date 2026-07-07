#!/usr/bin/env bash
# Haftalik laptop guvenlik ozeti (ban/WAF hattina dokunmaz)
#   bash scripts/operator_security_weekly.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
note() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); }

echo "=== operator_security_weekly ==="

if bash "$ROOT/scripts/laptop_harden_check.sh"; then
  note "laptop_harden_check"
else
  warn "laptop_harden_check"
fi

if bash "$ROOT/scripts/check_dashboard_tls_bind.sh" >/dev/null 2>&1; then
  note "dashboard_tls_bind"
elif bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  warn "dashboard :8443 LAN acik (internet-facing)"
else
  echo "[OK] dashboard_tls_bind — laptop profil (LAN acik olabilir)"
fi

if WARN_ONLY=1 bash "$ROOT/scripts/intel_ban_db_ops_check.sh" >/dev/null 2>&1; then
  stale=$(python3 -c "import json; print(json.load(open('$ROOT/intel-ban-db-report.json')).get('stale_rows',0))" 2>/dev/null || echo 0)
  note "intel_ban_db (stale=${stale})"
else
  warn "intel_ban_db_ops_check"
fi

if bash "$ROOT/scripts/edge_protection_checklist.sh" >/dev/null 2>&1; then
  ec=$(python3 -c "import json; s=json.load(open('$ROOT/edge-protection-checklist-report.json')).get('summary',{}); print(f\"{s.get('pass',0)}/{s.get('total',0)}\")" 2>/dev/null || echo "?")
  note "edge_protection_checklist ($ec)"
elif [[ -f "$ROOT/edge-protection-checklist-report.json" ]]; then
  warn "edge_protection_checklist — rapor eski veya fail"
fi

if SKIP_MORNING=1 bash "$ROOT/scripts/enterprise_e9_verify.sh" >/dev/null 2>&1; then
  e9_proof=$(python3 -c "import json; print(json.load(open('$ROOT/enterprise-e9-verify-report.json')).get('competitive_proof','?'))" 2>/dev/null || echo "?")
  note "enterprise_e9_verify ($e9_proof)"
else
  warn "enterprise_e9_verify — docs/ENTERPRISE_SUPPORT.md"
fi

if bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  echo "[INFO] Internet-facing — aylik cron: operator_post_install_strict (install_operator_cron)"
fi

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] operator_security_weekly"
  exit 0
fi
echo "[WARN] operator_security_weekly — $fail madde" >&2
exit 0
