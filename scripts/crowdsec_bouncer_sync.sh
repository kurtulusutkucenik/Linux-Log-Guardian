#!/usr/bin/env bash
# CrowdSec LAPI kararlari -> log-guardian API ban (dağıtık IP / botnet sınırı)
#   CROWDSEC_LAPI_URL=http://127.0.0.1:8080 CROWDSEC_API_KEY=... bash scripts/crowdsec_bouncer_sync.sh
#   CROWDSEC_DRY_RUN=1 bash scripts/crowdsec_bouncer_sync.sh  # yalnizca listele
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/crowdsec_env.sh
source "$ROOT/scripts/lib/crowdsec_env.sh" 2>/dev/null || true
crowdsec_env_load 2>/dev/null || true

LAPI="${CROWDSEC_LAPI_URL:-http://127.0.0.1:8081}"
KEY="${CROWDSEC_API_KEY:-}"
KEY="${KEY//[[:space:]]/}"
API_BASE="${LG_BAN_API_BASE:-http://127.0.0.1:8090}"
TOKEN="${API_TOKEN:-}"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
DRY="${CROWDSEC_DRY_RUN:-0}"
MAX="${CROWDSEC_MAX_DECISIONS:-50}"

fail() { echo "[crowdsec_bouncer_sync] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

if [[ -z "$TOKEN" && -f "$RULES" ]]; then
  TOKEN=$(grep -E '^API_TOKEN=' "$RULES" | head -1 | cut -d= -f2- || true)
fi
if [[ -z "$TOKEN" ]]; then
  fail "API_TOKEN yok — rules.conf veya env"
fi

if [[ -z "$KEY" ]]; then
  echo "[WARN] CROWDSEC_API_KEY yok — demo fixture kullaniliyor"
  DECISIONS_JSON='{"data":[{"decision":{"value":"203.0.113.250","type":"ban","duration":"1h","scenario":"crowdsec-demo"}}]}'
else
  DECISIONS_JSON=$(curl -sf -H "X-Api-Key: $KEY" \
    "${LAPI%/}/v1/decisions?limit=${MAX}&scopes=ip" 2>/dev/null) || {
    if [[ "$DRY" == "1" ]]; then
      echo "[WARN] LAPI erisilemedi ($LAPI) — dry-run fixture'a dusuluyor"
      DECISIONS_JSON='{"data":[{"decision":{"value":"203.0.113.250","type":"ban","duration":"1h","scenario":"crowdsec-demo"}}]}'
    else
      fail "CrowdSec LAPI erisilemedi ($LAPI)"
    fi
  }
  if [[ -z "$DECISIONS_JSON" || "$DECISIONS_JSON" == "null" ]]; then
    DECISIONS_JSON='{"data":[]}'
  fi
fi

python3 - "$DECISIONS_JSON" "$DRY" "$API_BASE" "$TOKEN" <<'PY'
import json, sys, urllib.request, urllib.error

raw, dry, base, token = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
try:
    data = json.loads(raw)
except json.JSONDecodeError as e:
    print(f"[crowdsec_bouncer_sync] FAIL: JSON {e}", file=sys.stderr)
    sys.exit(1)

if data is None:
    data = {}
if isinstance(data, list):
    items = data
elif isinstance(data, dict):
    items = data.get("data") or data.get("decisions") or []
else:
    items = []
if not items:
    print("[OK] crowdsec_bouncer_sync — 0 karar")
    sys.exit(0)

banned = 0
for row in items:
    dec = row.get("decision") or row
    ip = (dec.get("value") or dec.get("ip") or "").strip()
    if not ip or "." not in ip:
        continue
    reason = dec.get("scenario") or dec.get("reason") or "crowdsec"
    if dry == "1":
        print(f"  [dry-run] ban {ip} ({reason})")
        banned += 1
        continue
    url = f"{base.rstrip('/')}/api/v1/ban?ip={ip}&reason=crowdsec:{reason}"
    req = urllib.request.Request(url, method="POST", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if 200 <= resp.status < 300:
                banned += 1
                print(f"  [OK] ban {ip}")
            else:
                print(f"  [WARN] ban {ip} HTTP {resp.status}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"  [WARN] ban {ip} HTTP {e.code}", file=sys.stderr)

print(f"[OK] crowdsec_bouncer_sync — {banned} IP")
PY
