#!/usr/bin/env bash
# RULES_VERIFY=1 startup kaniti — journal GeoIP/threat-feed gurultusunden bagimsiz
#   bash scripts/rules_verify_probe.sh
#   LG_RULES=/etc/log-guardian/rules.conf bash scripts/rules_verify_probe.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CONF="${1:-${LG_RULES:-/etc/log-guardian/rules.conf}}"
LG_BIN="${LG_BIN:-$ROOT/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="/usr/local/bin/log-guardian"
[[ -x "$LG_BIN" ]] || { echo "[rules_verify_probe] binary yok" >&2; exit 1; }
[[ -f "$CONF" ]] || { echo "[rules_verify_probe] $CONF yok" >&2; exit 1; }
grep -q '^RULES_VERIFY=1' "$CONF" 2>/dev/null || {
  echo "[rules_verify_probe] RULES_VERIFY=1 degil — $CONF" >&2
  exit 1
}

# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()
prepare_lg_replay_auth
load_lg_replay_password

CACHE="$ROOT/.cache"
PROBE_LOG="$CACHE/rules_verify_probe.access"
mkdir -p "$CACHE"
printf '%s - - [%s] "GET / HTTP/1.1" 200 12 "-" "-"\n' \
  "203.0.113.55" "$(date -u '+%d/%b/%Y:%H:%M:%S +0000')" >"$PROBE_LOG"

ARGS=("$LG_BIN" "${LG_AUTH_ARGS[@]}" "$PROBE_LOG" --no-tui --json --no-ban --no-db --rules "$CONF")
if [[ ${#LG_AUTH_ARGS[@]} -eq 0 ]]; then
  set +e
  OUT=$(env LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" "${ARGS[@]}" 2>&1)
  RC=$?
  set -e
else
  set +e
  OUT=$("${ARGS[@]}" 2>&1)
  RC=$?
  set -e
fi

if [[ "$RC" -eq 0 ]] && echo "$OUT" | grep -q '\[rules_verify\] OK'; then
  echo "[OK] rules_verify_probe — manifest hash OK"
  exit 0
fi
if [[ "$RC" -eq 0 ]]; then
  echo "[OK] rules_verify_probe — startup (log islendi, journal satiri opsiyonel)"
  exit 0
fi
echo "[rules_verify_probe] FAIL rc=$RC" >&2
echo "$OUT" | tail -8 >&2
exit 1
