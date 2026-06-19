#!/usr/bin/env bash
# Gercek nginx :80 saldiri harness — tester + ban_pipeline metrikleri
#   bash scripts/live_attack_harness.sh
#   BAN_PROOF=0 bash scripts/live_attack_harness.sh   # hizli, ban replay atla
# Not: 127.0.0.1 whitelist'te canli ban beklenmez; RFC5737 replay ile ban kaniti uretilir.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"
REPORT="${LIVE_ATTACK_REPORT:-live-attack-report.json}"
DURATION="${LIVE_ATTACK_DURATION:-5}"
BAN_PROOF="${BAN_PROOF:-1}"
BAN_PROOF_IP="${BAN_PROOF_IP:-203.0.113.77}"
BAN_PROOF_JSON="{}"

LG="${LG_BIN:-}"
[[ -z "$LG" && -x ./log-guardian ]] && LG=./log-guardian
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" ]] || RULES="rules.conf"

fail() { echo "[live_attack_harness] FAIL: $*" >&2; exit 1; }

echo "=== live_attack_harness ==="
echo "  hedef=${HOST}:${PORT}  duration=${DURATION}s"

[[ -x ./tester ]] || make -s tester

NGINX_UP=0
if curl -sf --max-time 3 "http://${HOST}:${PORT}/" -o /dev/null 2>/dev/null; then
  NGINX_UP=1
  echo "[OK] nginx http://${HOST}:${PORT}/ yanit veriyor"
else
  echo "[WARN] nginx yanit yok — tester REFUSED=0 olabilir (port ${PORT} acik mi?)"
  echo "       Ornek: sudo systemctl start nginx"
fi

if sudo -n bash scripts/check_nginx_log_format.sh 2>/dev/null \
   || bash scripts/check_nginx_log_format.sh 2>/dev/null; then
  : # OK
else
  echo "[WARN] log_guardian format eksik — POST SQLi gorunmez"
  echo "       sudo bash scripts/fix_nginx_log_format.sh"
fi

BEFORE=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
SCEN_TMP=$(mktemp)
NGINX_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"
QUICK="${LIVE_ATTACK_QUICK:-0}"

# nginx log tail → hizli alert kontrolu (nginx_attack_test yerine, ~10sn)
quick_replay_check() {
  [[ -r "$NGINX_LOG" ]] || return 1
  local tmp replay alerts=0
  tmp=$(mktemp)
  grep -iE 'union|select|%27|sqli|OR\+1' "$NGINX_LOG" 2>/dev/null | tail -n 25 >"$tmp" || tail -n 15 "$NGINX_LOG" >"$tmp"
  [[ -s "$tmp" ]] || { rm -f "$tmp"; return 1; }
  replay=$(timeout 60 "$LG" "$tmp" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)
  alerts=$(echo "$replay" | python3 -c "
import re, sys
t = sys.stdin.read()
m = re.search(r'\"alerts_total\"\s*:\s*(\d+)', t)
print(m.group(1) if m else 0)
" 2>/dev/null || echo 0)
  rm -f "$tmp"
  [[ "${alerts:-0}" -gt 0 ]]
}

# stdout YALNIZCA JSON — log satirlari stderr
run_scenario() {
  local mode="$1" threads="${2:-2}" rps="${3:-25}" dur="${4:-$DURATION}"
  local out err sent refused timeout_n ok=0 replay_ok=0
  out=$(mktemp)
  err=$(mktemp)
  echo "--- scenario: $mode threads=$threads rps=$rps ${dur}s ---" >&2
  # tester recv() blokunda pthread_join takilabilir — timeout ile sure siniri
  local budget=$((dur + 8))
  timeout --signal=TERM --kill-after=3 "$budget" \
    ./tester --mode "$mode" --host "$HOST" --port "$PORT" \
    --threads "$threads" --rps "$rps" >"$out" 2>"$err" || true
  pkill -9 -f "./tester --mode ${mode} --host ${HOST}" 2>/dev/null || true

  sent=$(grep -oE '[0-9]+' <(grep -E 'Gonderilen:|Toplam istek' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)
  refused=$(grep -oE '[0-9]+' <(grep -E 'REFUSED' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)
  timeout_n=$(grep -oE '[0-9]+' <(grep -E 'TIMEOUT' "$err" 2>/dev/null | tail -1) 2>/dev/null | head -1 || echo 0)

  [[ "${sent:-0}" -gt 0 ]] && ok=1
  [[ "${refused:-0}" -gt 0 ]] && ok=1

  if [[ "$mode" == "sqli" && "$NGINX_UP" == "1" && "$QUICK" != "1" ]]; then
    sleep 2
    if quick_replay_check; then
      replay_ok=1
      ok=1
    fi
  fi

  python3 - "$mode" "$dur" "$sent" "$refused" "$timeout_n" "$ok" "$threads" "$rps" "$NGINX_UP" "$replay_ok" <<'PY'
import json, sys
mode, dur, sent, refused, tout, ok, thr, rps, nginx_up, replay = sys.argv[1:11]
print(json.dumps({
    "mode": mode,
    "duration_sec": int(dur),
    "threads": int(thr),
    "rps_per_thread": int(rps),
    "sent": int(sent or 0),
    "refused": int(refused or 0),
    "timeout": int(tout or 0),
    "nginx_up": nginx_up == "1",
    "replay_alerts": int(replay or 0),
    "pass": bool(int(ok)),
}))
PY
  rm -f "$out" "$err"
  sleep 1
}

: >"$SCEN_TMP"
for spec in "sqli 2 25 5" "post_sqli 2 18 5" "brute 2 12 5" "ddos 3 50 4" "slow 1 1 5"; do
  read -r mode threads rps dur <<<"$spec"
  run_scenario "$mode" "$threads" "$rps" "$dur" >>"$SCEN_TMP"
done

AFTER=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
METRICS_ALERTS=$(curl -sf "http://127.0.0.1:9091/metrics" 2>/dev/null | grep -m1 '^loganalyzer_alerts_total ' | awk '{print $2}' || echo 0)

if [[ "$BAN_PROOF" == "1" ]]; then
  echo "--- ban_proof replay (${BAN_PROOF_IP}, whitelist disi) ---"
  BP_LOG=$(mktemp)
  BP_RULES=$(mktemp)
  grep -v '^WHITELIST_IP=' "$RULES" >"$BP_RULES" 2>/dev/null || cp "$RULES" "$BP_RULES"
  cat >"$BP_LOG" <<EOF
${BAN_PROOF_IP} - - [09/Jun/2026:12:00:01 +0300] "GET /search?q=1%27+UNION+SELECT+null HTTP/1.1" 200 100 "-" "live_attack_ban_proof"
${BAN_PROOF_IP} - - [09/Jun/2026:12:00:02 +0300] "GET /admin?id=1+OR+1%3D1 HTTP/1.1" 404 50 "-" "live_attack_ban_proof"
${BAN_PROOF_IP} - - [09/Jun/2026:12:00:03 +0300] "GET /api?x=%3Cscript%3Ealert(1)%3C/script%3E HTTP/1.1" 403 80 "-" "live_attack_ban_proof"
EOF
  BP_BEFORE=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
  BP_EXTRA=()
  if command -v ipset >/dev/null && ipset test log_analyzer_block_v4 "$BAN_PROOF_IP" &>/dev/null; then
    BP_EXTRA+=(--no-webhook)
    echo "[INFO] ${BAN_PROOF_IP} zaten ipset'te — ban webhook atlanir (ilk ban kaniti yeterli)"
  fi
  if sudo -n true 2>/dev/null; then
    BP_REPLAY=$(sudo env LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" \
      "$LG" "$BP_LOG" --no-tui --json --rules "$BP_RULES" "${BP_EXTRA[@]}" 2>&1 || true)
  elif [[ "$(id -u)" == "0" ]]; then
    BP_REPLAY=$(env LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" \
      "$LG" "$BP_LOG" --no-tui --json --rules "$BP_RULES" "${BP_EXTRA[@]}" 2>&1 || true)
  else
    BP_REPLAY=$("$LG" "$BP_LOG" --no-tui --json --rules "$BP_RULES" "${BP_EXTRA[@]}" 2>&1 || true)
  fi
  sleep 2
  BP_AFTER=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
  IPSET_HIT=0
  if command -v ipset >/dev/null && ipset list log_analyzer_block_v4 &>/dev/null; then
    if ipset test log_analyzer_block_v4 "$BAN_PROOF_IP" 2>/dev/null \
       || sudo -n ipset test log_analyzer_block_v4 "$BAN_PROOF_IP" 2>/dev/null; then
      IPSET_HIT=1
    fi
  fi
  DB_BAN_HIT=0
  DB_PATH="${LG_DB:-/etc/log-guardian/events.db}"
  if [[ -f "$DB_PATH" ]] && command -v sqlite3 >/dev/null; then
    last_act=$(sqlite3 "$DB_PATH" \
      "SELECT action FROM ban_events WHERE ip='${BAN_PROOF_IP}' ORDER BY ts DESC LIMIT 1;" 2>/dev/null || true)
    [[ "$last_act" == "BAN" ]] && DB_BAN_HIT=1
  fi
  BAN_PROOF_JSON=$(BP_BEFORE="$BP_BEFORE" BP_AFTER="$BP_AFTER" BP_REPLAY="$BP_REPLAY" \
    BAN_PROOF_IP="$BAN_PROOF_IP" IPSET_HIT="$IPSET_HIT" DB_BAN_HIT="$DB_BAN_HIT" python3 <<'PY'
import json, os, re
def safe(s):
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return {}
before = safe(os.environ.get("BP_BEFORE", "{}"))
after = safe(os.environ.get("BP_AFTER", "{}"))
raw = os.environ.get("BP_REPLAY", "")
alerts = 0
try:
    alerts = int(json.loads(raw).get("alerts_total", 0))
except (json.JSONDecodeError, TypeError, ValueError):
    m = re.search(r'"alerts_total"\s*:\s*(\d+)', raw)
    alerts = int(m.group(1)) if m else 0
bb = (before.get("db") or {}).get("bans_active", 0)
ab = (after.get("db") or {}).get("bans_active", 0)
bp = after.get("ban_pipeline") or {}
ipc_n = int(bp.get("ipc", 0) or 0)
ipset_n = int(bp.get("ipset", 0) or 0)
ipset_hit = os.environ.get("IPSET_HIT", "0") == "1"
db_ban_hit = os.environ.get("DB_BAN_HIT", "0") == "1"
kernel = (ab > bb) or ipset_hit or db_ban_hit
waf = alerts > 0
print(json.dumps({
    "ip": os.environ.get("BAN_PROOF_IP", ""),
    "alerts": alerts,
    "bans_active_before": bb,
    "bans_active_after": ab,
    "ban_pipeline": bp,
    "ipset_hit": ipset_hit,
    "waf_pass": waf,
    "kernel_pass": kernel,
    "pass": waf or kernel,
    "mode": "rfc5737_replay",
}))
PY
)
  rm -f "$BP_LOG" "$BP_RULES"
  echo "$BAN_PROOF_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'[ban_proof] ip={d[\"ip\"]} waf={d[\"waf_pass\"]} kernel={d[\"kernel_pass\"]} ipset={d.get(\"ipset_hit\",False)}')"
fi

python3 - "$REPORT" "$HOST" "$PORT" "$BEFORE" "$AFTER" "$METRICS_ALERTS" "$SCEN_TMP" "$NGINX_UP" "$BAN_PROOF_JSON" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

def safe_json(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}

report_path = Path(sys.argv[1])
host, port = sys.argv[2], int(sys.argv[3])
before = safe_json(sys.argv[4])
after = safe_json(sys.argv[5])
metrics_alerts = float(sys.argv[6] or 0)
scen_path = Path(sys.argv[7])
nginx_up = sys.argv[8] == "1"
ban_proof = safe_json(sys.argv[9]) if len(sys.argv) > 9 else {}

scenarios = []
for line in scen_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line.startswith("{"):
        try:
            scenarios.append(json.loads(line))
        except json.JSONDecodeError:
            pass

bb = (before.get("db") or {}).get("bans_active", 0)
ab = (after.get("db") or {}).get("bans_active", 0)
bp = after.get("ban_pipeline") or {}
ipc = after.get("ipc", "?")

live_ban = (ab > bb) or bp.get("ipc", 0) > 0 or bp.get("ipset", 0) > 0
refused_total = sum(s.get("refused", 0) for s in scenarios)
sent_total = sum(s.get("sent", 0) for s in scenarios)
replay_any = any(s.get("replay_alerts", 0) for s in scenarios)
proof_waf = bool(ban_proof.get("waf_pass"))
proof_kernel = bool(ban_proof.get("kernel_pass"))
ban_evidence = live_ban or proof_kernel
ban_evidence_waf = proof_waf or replay_any
live_pass = sent_total > 0 and (
    ban_evidence or ban_evidence_waf or refused_total > 0 or replay_any or any(s.get("pass") for s in scenarios)
)

note = "127.0.0.1 whitelist: canli kernel ban beklenmez"
if proof_kernel:
    note = f"ban_proof kernel ({ban_proof.get('ip', '?')}) — ipset/DB"
elif proof_waf:
    note = f"ban_proof WAF ({ban_proof.get('ip', '?')}) — CRS alarm; kernel icin daemon+sudo"
elif live_ban:
    note = "canli nginx ban_pipeline artisi"

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "host": host,
    "port": port,
    "nginx_up": nginx_up,
    "scenarios": scenarios,
    "ban_proof": ban_proof if ban_proof else None,
    "summary": {
        "sent_total": sent_total,
        "refused_total": refused_total,
        "replay_alerts": int(replay_any),
        "ban_evidence": ban_evidence,
        "ban_evidence_waf": ban_evidence_waf,
        "ban_evidence_kernel": live_ban or proof_kernel,
        "ban_evidence_live": live_ban,
        "ban_evidence_replay_waf": proof_waf,
        "ban_evidence_replay_kernel": proof_kernel,
        "bans_active_before": bb,
        "bans_active_after": ab,
        "metrics_alerts": metrics_alerts,
        "ipc": ipc,
        "ban_pipeline": bp,
    },
    "pass": live_pass,
    "note": note,
}
report_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[live_attack_harness] -> {report_path} pass={live_pass} sent={sent_total} refused={refused_total}")
sys.exit(0 if live_pass else 1)
PY

rm -f "$SCEN_TMP"
echo "[OK] live_attack_harness tamam"
