#!/usr/bin/env bash
# Canli operator/daemon durumu -> guardian-status.json (dashboard)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

OUT="${GUARDIAN_STATUS_JSON:-guardian-status.json}"
RULES="${GUARDIAN_STATUS_RULES:-rules.conf}"
DB="${GUARDIAN_STATUS_DB:-events.db}"

if [[ -f /etc/log-guardian/rules.conf ]]; then
  RULES="/etc/log-guardian/rules.conf"
fi
if [[ -f /etc/log-guardian/events.db ]]; then
  DB="/etc/log-guardian/events.db"
fi

LG_QUIET_BUILD=1 make -s log-guardian 2>/dev/null || true

if ./log-guardian --status --quiet --rules "$RULES" --db "$DB" > "$OUT" 2>/dev/null; then
  echo "[guardian_status_export] $OUT (rules=$RULES)"
else
  echo '{"ipc":"fail","xdp_mode":"unknown","ban_pipeline":{"ipc":0,"xdp":0,"ipset":0,"failed":0}}' > "$OUT"
  echo "[WARN] status export fallback" >&2
fi
