#!/usr/bin/env bash
# CrowdSec LAPI kararlari -> log-guardian ban API (fixture veya canli)
#   bash scripts/crowdsec_bouncer_e2e.sh
#   LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh  # :8090 aciksa gercek POST
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RULES="${LG_RULES:-$ROOT/rules.conf}"
API_BASE="${LG_BAN_API_BASE:-http://127.0.0.1:8090}"
TEST_IP="203.0.113.251"
REPORT="${ROOT}/crowdsec-bouncer-report.json"
LIVE="${LIVE_API:-0}"
MODE="dry-run"
LIVE_OK=false
DECISIONS=1

fail() { echo "[crowdsec_bouncer_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

TOKEN="${API_TOKEN:-}"
if [[ -z "$TOKEN" && -f "$RULES" ]]; then
  TOKEN=$(grep -E '^API_TOKEN=' "$RULES" | head -1 | cut -d= -f2- || true)
fi

echo "=== crowdsec_bouncer_e2e ==="

out="$(CROWDSEC_DRY_RUN=1 bash "$ROOT/scripts/crowdsec_bouncer_sync.sh" 2>&1)" || fail "dry-run sync"
echo "$out"
[[ "$out" == *"[OK]"* ]] || fail "dry-run beklenen OK yok"
DECISIONS=$(echo "$out" | grep -oE '[0-9]+ IP' | grep -oE '[0-9]+' | head -1 || echo 1)

if [[ "$LIVE" == "1" && -n "$TOKEN" ]]; then
  if curl -sf --max-time 2 -H "Authorization: Bearer $TOKEN" \
    "${API_BASE}/api/v1/metrics" >/dev/null 2>&1; then
    MODE="live-api"
    out="$(env API_TOKEN="$TOKEN" LG_BAN_API_BASE="$API_BASE" LG_RULES="$RULES" \
      CROWDSEC_DRY_RUN=0 bash "$ROOT/scripts/crowdsec_bouncer_sync.sh" 2>&1)" || fail "live sync"
    echo "$out"
    curl -sf --max-time 5 -X POST \
      -H "Authorization: Bearer $TOKEN" \
      "${API_BASE}/api/v1/unban?ip=${TEST_IP}" >/dev/null 2>&1 || true
    LIVE_OK=true
    ok "live ban API (${API_BASE})"
  else
    echo "[WARN] LIVE_API=1 ama ${API_BASE} yanit vermiyor — dry-run ile devam"
  fi
fi

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
live_ok = "${LIVE_OK}" == "true"
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "${MODE}",
    "decisions_synced": int("${DECISIONS:-1}"),
    "live_api_ok": live_ok,
    "api_base": "${API_BASE}",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "crowdsec_bouncer_e2e ($MODE)"
echo "[OK] crowdsec_bouncer_e2e"
