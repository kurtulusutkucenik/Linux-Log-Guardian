#!/usr/bin/env bash
# Sprint AD — Edge koruma laptop/prod kapısı (nginx + XDP/ipset + threat intel özeti)
#   bash scripts/edge_protection_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${EDGE_PROTECTION_GATE_REPORT:-edge-protection-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/edge_protection_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[edge_protection_gate] FAIL: $*" >&2
  exit 1
}

LG="${LG_BIN:-}"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
[[ -z "$LG" && -x ./log-guardian ]] && LG=./log-guardian
[[ -x "$LG" ]] || fail "log-guardian binary yok"

RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" ]] || RULES="rules.conf"

echo "=== edge_protection_gate (Sprint AD) ==="

ST=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || "$LG" --status --quiet 2>/dev/null || echo '{}')

# prod_nic_xdp_check (bilgi; hata kodu yutmaz)
bash "$ROOT/scripts/prod_nic_xdp_check.sh" >/dev/null 2>&1 || true

DEFAULT_IF=$(ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev"){print $(i+1); exit}}' || true)
DEFAULT_IF="${DEFAULT_IF:-?}"

nginx_format=0
if bash "$ROOT/scripts/check_nginx_log_format.sh" >/dev/null 2>&1; then
  nginx_format=1
fi

nginx_snippets=0
if [[ -f /etc/nginx/snippets/log-guardian.conf ]] && [[ -f /etc/nginx/snippets/log-guardian-server.conf ]]; then
  nginx_snippets=1
fi

nginx_live=0
live_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:80/ 2>/dev/null || echo 000)
[[ "$live_code" =~ ^[2345][0-9]{2}$ ]] && nginx_live=1

whitelist_n=0
if [[ -f "$RULES" ]]; then
  whitelist_n=$(grep -c '^WHITELIST_IP=' "$RULES" 2>/dev/null || echo 0)
fi

ipset_n=0
if command -v ipset >/dev/null && ipset list log_analyzer_block_v4 &>/dev/null; then
  ipset_n=$(ipset list log_analyzer_block_v4 2>/dev/null | grep -c '^[0-9]' || echo 0)
fi

threat_legacy=0
threat_summary=0
DB="/etc/log-guardian/events.db"
if [[ -f "$DB" ]] && command -v sqlite3 >/dev/null; then
  threat_legacy=$(sqlite3 "$DB" \
    "SELECT COUNT(*) FROM ban_events WHERE reason='threat-intel' AND ip != 'system';" 2>/dev/null || echo 0)
  threat_summary=$(sqlite3 "$DB" \
    "SELECT COUNT(*) FROM ban_events WHERE ip='system' AND reason LIKE 'threat-intel-summary:%';" 2>/dev/null || echo 0)
fi

python3 - "$REPORT" "$ST" "$DEFAULT_IF" "$nginx_format" "$nginx_snippets" "$nginx_live" \
  "$whitelist_n" "$ipset_n" "$threat_legacy" "$threat_summary" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path = sys.argv[1]
status = json.loads(sys.argv[2] or "{}")
default_if = sys.argv[3]
nginx_format = int(sys.argv[4])
nginx_snippets = int(sys.argv[5])
nginx_live = int(sys.argv[6])
whitelist_n = int(sys.argv[7])
ipset_n = int(sys.argv[8])
threat_legacy = int(sys.argv[9])
threat_summary = int(sys.argv[10])

ipc = status.get("ipc", "?")
xdp_mode = status.get("xdp_mode", "?")
daemon = status.get("daemon") or {}
xdp_active = bool(daemon.get("xdp_active"))
db = status.get("db") or {}
bans_active = int(db.get("bans_active") or 0)
bp = status.get("ban_pipeline") or {}

reasons = []
if ipc != "ok":
    reasons.append(f"ipc={ipc}")
if xdp_mode not in ("ipset-fallback", "kernel-xdp"):
    reasons.append(f"xdp_mode={xdp_mode}")
if nginx_format == 0 and nginx_snippets == 0:
    reasons.append("nginx_edge_yok")
if whitelist_n < 1:
    reasons.append("whitelist_yok")
if threat_legacy > 500:
    reasons.append(f"threat_intel_legacy={threat_legacy}")
ban_path = ipset_n > 0 or bans_active > 0 or int(bp.get("ipset") or 0) > 0
if not ban_path:
    reasons.append("ban_path_yok")

wifi_nic = default_if.startswith("wl")
ok = len(reasons) == 0

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "ipc": ipc,
    "xdp_mode": xdp_mode,
    "xdp_active": xdp_active,
    "default_nic": default_if,
    "wifi_nic": wifi_nic,
    "nginx_log_format": bool(nginx_format),
    "nginx_snippets": bool(nginx_snippets),
    "nginx_live": bool(nginx_live),
    "whitelist_count": whitelist_n,
    "ipset_entries": ipset_n,
    "bans_active": bans_active,
    "threat_intel_legacy_rows": threat_legacy,
    "threat_intel_summary_rows": threat_summary,
    "ban_pipeline_ipset": int(bp.get("ipset") or 0),
    "script": "scripts/edge_protection_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)

Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

echo "[OK] edge_protection_gate — ipc=$(
  python3 -c "import json; print(json.load(open('$REPORT')).get('ipc','?'))"
) xdp=$(
  python3 -c "import json; print(json.load(open('$REPORT')).get('xdp_mode','?'))"
) ipset=$(
  python3 -c "import json; print(json.load(open('$REPORT')).get('ipset_entries',0))"
)"
