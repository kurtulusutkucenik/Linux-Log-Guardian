#!/usr/bin/env bash
# TAXII/STIX feed -> ban API (fixture veya canli TAXII URL)
#   bash scripts/taxii_feed_e2e.sh
#   LIVE_API=1 bash scripts/taxii_feed_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"
API_BASE="${LG_BAN_API_BASE:-http://127.0.0.1:8090}"
REPORT="${ROOT}/taxii-feed-report.json"
LIVE="${LIVE_API:-0}"
MODE="dry-run"
LIVE_OK=false
IOCS=2
SKIPPED_LOW=0
MIN_CONF="${TAXII_MIN_CONFIDENCE:-70}"
STIX_SOURCE="fixture"

fail() { echo "[taxii_feed_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

# Gercek TAXII sunucusu yoksa env verme — fixture yolu yeterli (O2 laptop)
if [[ -n "${TAXII_URL:-}" ]] && [[ "${TAXII_URL}" == *'...'* ]]; then
  echo "[WARN] TAXII_URL placeholder — fixture kullanilacak (gercek feed icin rules.conf TAXII_URL)"
  unset TAXII_URL TAXII_API_KEY
fi

TOKEN="${API_TOKEN:-}"
if [[ -z "$TOKEN" && -f "$RULES" ]]; then
  TOKEN=$(grep -E '^API_TOKEN=' "$RULES" | head -1 | cut -d= -f2- || true)
fi

echo "=== taxii_feed_e2e ==="

out="$(TAXII_DRY_RUN=1 LG_RULES="$RULES" TAXII_MIN_CONFIDENCE="$MIN_CONF" \
  bash "$ROOT/scripts/taxii_feed_sync.sh" 2>&1)" || fail "dry-run sync"
echo "$out"
STIX_SOURCE="fixture"
echo "$out" | grep -q '^\[OK\] TAXII_URL:' && STIX_SOURCE="taxii-url"
[[ "$out" == *"[OK]"* ]] || fail "dry-run beklenen OK yok"
IOCS=$(echo "$out" | grep -c '\[dry-run\] ban ' || echo 0)
SKIPPED_LOW=$(echo "$out" | grep -c 'skip 203.0.113.254' || echo 0)
[[ "${IOCS:-0}" -ge 2 ]] || fail "confidence gate: en az 2 yuksek IOC dry-run (got $IOCS)"
[[ "${SKIPPED_LOW:-0}" -ge 1 ]] || fail "confidence gate: dusuk IOC atlanmali (203.0.113.254)"

if [[ "$LIVE" == "1" && -n "$TOKEN" ]]; then
  if curl -sf --max-time 2 -H "Authorization: Bearer $TOKEN" \
    "${API_BASE}/api/v1/metrics" >/dev/null 2>&1; then
    MODE="live-api"
    out="$(env API_TOKEN="$TOKEN" LG_BAN_API_BASE="$API_BASE" LG_RULES="$RULES" \
      TAXII_DRY_RUN=0 TAXII_MIN_CONFIDENCE="$MIN_CONF" bash "$ROOT/scripts/taxii_feed_sync.sh" 2>&1)" || fail "live sync"
    echo "$out"
    if echo "$out" | grep -q '^\[OK\] TAXII_URL:'; then
      STIX_SOURCE="taxii-url"
    fi
    for ip in 203.0.113.252 203.0.113.253; do
      curl -sf --max-time 5 -X POST \
        -H "Authorization: Bearer $TOKEN" \
        "${API_BASE}/api/v1/unban?ip=${ip}" >/dev/null 2>&1 || true
    done
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
    "stix_source": "${STIX_SOURCE}",
    "iocs_synced": int("${IOCS:-2}"),
    "skipped_low_confidence": int("${SKIPPED_LOW:-1}"),
    "min_confidence": int("${MIN_CONF:-70}"),
    "live_api_ok": live_ok,
    "api_base": "${API_BASE}",
    "fixture": "corpus/fixtures/taxii_stix_bundle.json",
    "note": "Laptop: TAXII_URL gerekmez; fixture + confidence gate yeterli. Canli feed: rules.conf TAXII_URL",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "taxii_feed_e2e ($MODE, min_conf=$MIN_CONF)"
echo "[OK] taxii_feed_e2e"
