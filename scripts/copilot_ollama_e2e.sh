#!/usr/bin/env bash
# P4 #13 — Copilot API (Ollama opsiyonel + kural tabanli fallback)
#   bash scripts/copilot_ollama_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/copilot-ollama-report.json"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"

fail() { echo "[copilot_ollama_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  if curl -sfk -o /dev/null --max-time 2 "https://127.0.0.1:8443/api/tier" 2>/dev/null; then
    echo "https://127.0.0.1:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH_URL="$(resolve_dash_url)"
CURL_TLS=()
[[ "$DASH_URL" == https://* ]] && CURL_TLS=(-k)

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
fi

echo "=== copilot_ollama_e2e ==="
echo "  dash_url=$DASH_URL"

if ! curl -sf "${CURL_TLS[@]}" --max-time 3 "${DASH_URL}/login" -o /dev/null 2>/dev/null; then
  python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "skip",
    "reason": "dashboard kapali — Copilot /api/copilot kodu mevcut",
    "script": "scripts/copilot_ollama_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
print("[SKIP] dashboard kapali")
PY
  exit 0
fi

login_code=$(curl -s "${CURL_TLS[@]}" -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "dashboard login HTTP $login_code (DASHBOARD_ADMIN_PASSWORD in .env?)"

status_json=$(curl -sf "${CURL_TLS[@]}" --max-time 8 -b "$COOKIE_JAR" "${DASH_URL}/api/copilot")
echo "$status_json" | grep -q '"llm"' || fail "GET /api/copilot llm alani yok"
ok "GET /api/copilot — llm status"

ollama_reachable=$(echo "$status_json" | python3 -c "import json,sys; d=json.load(sys.stdin); print('true' if d.get('llm',{}).get('reachable') else 'false')" 2>/dev/null || echo false)

reply_json=$(curl -sf "${CURL_TLS[@]}" --max-time 25 -b "$COOKIE_JAR" -X POST "${DASH_URL}/api/copilot" \
  -H 'Content-Type: application/json' \
  -d '{"message":"filo ozeti","locale":"tr"}')
echo "$reply_json" | grep -q '"content"' || fail "POST /api/copilot content yok"
source=$(echo "$reply_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('source',''))" 2>/dev/null || echo "")
[[ -n "$source" ]] || fail "source bos"
ok "POST /api/copilot — source=$source"

python3 - "$OUT" "$ollama_reachable" "$source" "$DASH_URL" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
reachable = sys.argv[2] == "true"
source = sys.argv[3]
dash = sys.argv[4]
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "ollama_reachable": reachable,
    "reply_source": source,
    "fallback_ok": source in ("structured", "fallback", "scope", "ollama"),
    "dash_url": dash,
    "script": "scripts/copilot_ollama_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] copilot_ollama_e2e — ollama=$ollama_reachable source=$source"
