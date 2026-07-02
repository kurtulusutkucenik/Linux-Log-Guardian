#!/usr/bin/env bash
# Sprint hardening — yerel kapı (sudo yok): RULES_VERIFY startup + STIX E2E
#   bash scripts/sprint_harden_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0
ok() { echo "  [OK] $*"; }
bad() { echo "  [FAIL] $*"; fail=$((fail + 1)); }

echo "=== sprint_harden_gate ==="

echo "--- build ---"
make -j"$(nproc)" -q log-guardian 2>/dev/null && ok "make" || {
  make -j"$(nproc)" log-guardian || { bad "make"; exit 1; }
  ok "make"
}

echo "--- rules manifest ---"
bash scripts/rules_bundle_manifest.sh
[[ -f rules/crs-bundle.manifest.json ]] && ok "manifest" || bad "manifest"

echo "--- RULES_VERIFY startup probe ---"
CACHE="$ROOT/.cache"
PROBE_RULES="$CACHE/harden_probe.rules.conf"
PROBE_LOG="$CACHE/harden_probe.access"
mkdir -p "$CACHE"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()
prepare_lg_replay_auth
load_lg_replay_password
grep -v '^RULES_VERIFY=' "$ROOT/rules.conf" >"$PROBE_RULES"
echo 'RULES_VERIFY=1' >>"$PROBE_RULES"
chmod 600 "$PROBE_RULES"
printf '%s - - [%s] "GET / HTTP/1.1" 200 12 "-" "-"\n' \
  "203.0.113.55" "$(date -u '+%d/%b/%Y:%H:%M:%S +0000')" >"$PROBE_LOG"
PROBE_ARGS=(./log-guardian "${LG_AUTH_ARGS[@]}" "$PROBE_LOG" --no-tui --json --no-ban --no-db --rules "$PROBE_RULES")
if [[ ${#LG_AUTH_ARGS[@]} -eq 0 ]]; then
  set +e
  PROBE_OUT=$(env LOGANALYZER_PASSWORD="$LOGANALYZER_PASSWORD" "${PROBE_ARGS[@]}" 2>&1)
  PROBE_RC=$?
  set -e
else
  set +e
  PROBE_OUT=$("${PROBE_ARGS[@]}" 2>&1)
  PROBE_RC=$?
  set -e
fi
if [[ "$PROBE_RC" -eq 0 ]] && echo "$PROBE_OUT" | grep -q '\[rules_verify\] OK'; then
  ok "RULES_VERIFY=1 startup"
elif [[ "$PROBE_RC" -eq 0 ]]; then
  ok "RULES_VERIFY=1 startup (probe log islendi)"
else
  echo "$PROBE_OUT" | tail -5 >&2
  bad "RULES_VERIFY startup (rc=$PROBE_RC)"
fi

echo "--- SIEM JSON ---"
SIEM_CAPTURE_PORT=15044 bash scripts/siem_export_e2e.sh && ok "siem json" || bad "siem json"

echo "--- SIEM STIX ---"
SIEM_CAPTURE_PORT=15045 SIEM_FORMAT=stix bash scripts/siem_export_e2e.sh && ok "siem stix" || bad "siem stix"

echo "--- sprint security gate ---"
bash scripts/sprint_security_intel_gate.sh && ok "sprint_security_intel_gate" || bad "sprint_security_intel_gate"

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] sprint_harden_gate — prod icin: sudo bash scripts/sprint_harden_prod.sh"
  exit 0
fi
echo "[FAIL] sprint_harden_gate — $fail madde" >&2
exit 1
