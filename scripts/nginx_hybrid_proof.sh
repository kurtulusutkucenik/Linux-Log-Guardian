#!/usr/bin/env bash
# Inline consult + log_guardian hibrit kanit (prod default)
#   bash scripts/nginx_hybrid_proof.sh
#   sudo bash scripts/nginx_hybrid_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

REPORT="${NGINX_HYBRID_REPORT:-nginx-hybrid-report.json}"

fail() { echo "[nginx_hybrid] FAIL: $*" >&2; exit 1; }

echo "=== nginx_hybrid_proof ==="

if [[ "$(id -u)" -ne 0 ]] && ! needs_sudo_lg_replay; then
  echo "[INFO] ozel ACCESS_PASSWORD_KDF — sudo ile replay"
  exec sudo -E LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" bash "$0" "$@"
fi
load_lg_replay_password

ensure_lg_build_tree "$ROOT"
[[ -x ./log-guardian ]] || make -s -j1 log-guardian

LG="${LG_BIN:-}"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
[[ -z "$LG" ]] && LG=./log-guardian

RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" && -r "$RULES" ]] || RULES="rules.conf"

log_format_ok=0
inline_ok=0
api_pass=0
edge_sqli_code=0
edge_benign_code=0
log_replay_alerts=0

if bash "$ROOT/scripts/check_nginx_log_format.sh"; then
  log_format_ok=1
fi

if bash "$ROOT/scripts/check_nginx_inline_consult.sh"; then
  inline_ok=1
fi

if bash "$ROOT/scripts/nginx_inline_consult_proof.sh"; then
  api_pass=1
fi

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"
edge_reachable=0
edge_probe=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
  "http://${HOST}:${PORT}/" -A "Mozilla/5.0" 2>/dev/null || echo 000)
if [[ "$edge_probe" =~ ^[0-9]+$ && "$edge_probe" != "000" && "$edge_probe" != "0" ]]; then
  edge_reachable=1
  edge_sqli_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
    "http://${HOST}:${PORT}/?id=1+UNION+SELECT+1,2--" \
    -A "sqlmap/1.8" 2>/dev/null || echo 0)
  edge_benign_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
    "http://${HOST}:${PORT}/api/health" \
    -A "Mozilla/5.0" 2>/dev/null || echo 0)
  echo "[nginx_hybrid] edge probe=${edge_probe} union=${edge_sqli_code} benign=${edge_benign_code}"
else
  echo "[WARN] nginx :${PORT} erisilemedi (probe=${edge_probe}) — edge test atlandi" >&2
  echo "       systemctl status nginx && curl -v http://127.0.0.1:${PORT}/" >&2
fi

tmp=$(mktemp)
replay_rules=$(mktemp)
echo '203.0.113.88 - - [09/Jun/2026:10:00:01 +0300] "GET /search?q=1%27+UNION+SELECT+null HTTP/1.1" 200 100 "-" "nginx_hybrid_proof"' >"$tmp"
grep -v '^BLOCK_COUNTRIES=' "$RULES" >"$replay_rules" 2>/dev/null || cp "$RULES" "$replay_rules"
REPLAY_JSON=$("$LG" "$tmp" --no-tui --json --rules "$replay_rules" --no-db --no-webhook 2>/dev/null || true)
log_replay_alerts=$(echo "$REPLAY_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('alerts_total',0))" 2>/dev/null || echo 0)
rm -f "$tmp" "$replay_rules"
echo "[nginx_hybrid] log replay alerts=${log_replay_alerts}"

edge_sqli_ok=0
edge_benign_ok=0
log_ingest_ok=0
[[ "$edge_sqli_code" == "403" ]] && edge_sqli_ok=1
[[ "$edge_benign_code" == "200" || "$edge_benign_code" == "404" ]] && edge_benign_ok=1
[[ "${log_replay_alerts:-0}" -gt 0 ]] && log_ingest_ok=1

pass=0
if [[ $log_format_ok -eq 1 && $inline_ok -eq 1 && $api_pass -eq 1 && $edge_sqli_ok -eq 1 && $log_ingest_ok -eq 1 ]]; then
  pass=1
fi

python3 - "$REPORT" "$log_format_ok" "$inline_ok" "$api_pass" "$edge_reachable" "$edge_sqli_code" "$edge_benign_code" "$log_replay_alerts" "$pass" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report = Path(sys.argv[1])
log_fmt, inline, api, edge_up, sqli_c, benign_c, replay_alerts, passed = (
    int(x) for x in sys.argv[2:10]
)
passed = bool(passed)

def code(v):
    return int(v) if str(v).isdigit() else 0

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": "inline+log hybrid",
    "checks": {
        "log_guardian_format": bool(log_fmt),
        "inline_consult_nginx": bool(inline),
        "api_consult": bool(api),
        "edge_reachable": bool(edge_up),
        "edge_sqli_blocked": {"http_code": code(sqli_c), "expect": 403},
        "edge_benign": {"http_code": code(benign_c), "expect": "200|404"},
        "log_replay_alerts": replay_alerts,
        "log_ingest": replay_alerts > 0,
    },
    "pass": passed,
    "note": "prod default: auth_request + log_guardian access_log",
}
report.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[nginx_hybrid] log_fmt={log_fmt} inline={inline} api={api} edge_sqli={sqli_c} replay={replay_alerts} pass={passed}")
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true

[[ "$pass" -eq 1 ]] || fail "hibrit kanit eksik (log_fmt=$log_format_ok inline=$inline_ok api=$api_pass edge_reach=$edge_reachable edge_sqli=$edge_sqli_code replay=$log_replay_alerts)"
echo "[OK] nginx_hybrid_proof -> $REPORT"
