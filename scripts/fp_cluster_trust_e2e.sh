#!/usr/bin/env bash
# FP guvenilir IP — JA3/UA cluster flush disinda birakilir (tekil WAF SQLi ayri kanal)
#   bash scripts/fp_cluster_trust_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LG="${LG_BIN:-$ROOT/log-guardian}"
[[ -x "$LG" ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

TRUSTED_IP="${FP_CLUSTER_TRUSTED_IP:-10.0.0.50}"
ATTACK_BASE="${FP_CLUSTER_ATTACK_BASE:-45.33.60}"
REPORT="${FP_CLUSTER_TRUST_REPORT:-fp-cluster-trust-report.json}"
BASE_RULES="${FP_CLUSTER_RULES:-$ROOT/rules.conf}"
[[ -f "$BASE_RULES" ]] || BASE_RULES="$ROOT/test_rules.conf"

RULES=$(mktemp)
LOG=$(mktemp)
STORE=$(mktemp)
OUT=$(mktemp)
trap 'rm -f "$RULES" "$LOG" "$STORE" "$OUT"' EXIT

{
  grep -vE '^(FP_LEARN|FP_TRUST_|METRICS_PORT|LOG_PATH|JA3_CLUSTER)' "$BASE_RULES" \
    | grep -v '^[[:space:]]*#' || true
  cat <<EOF
METRICS_PORT=0
LOG_PATH=/dev/null
FP_LEARN=1
FP_TRUST_DAYS=0
FP_TRUST_MIN_SAMPLES=10
FP_TRUST_STORE=$STORE
JA3_CLUSTER_BAN=1
JA3_CLUSTER_MIN_IPS=3
EOF
} >"$RULES"

now=$(date +%s)
old=$((now - 86400 * 40))
printf '%s 0.950000 50 0 %s %s 0\n' "$TRUSTED_IP" "$old" "$now" >"$STORE"

UA='sqlmap/1.8#fp-cluster-trust (https://sqlmap.org)'
TS=$(LC_TIME=C date -u +"%d/%b/%Y:%H:%M:%S +0000")
for i in 1 2 3; do
  printf '%s - - [%s] "GET /search?q=1%%27+UNION+SELECT+null,null-- HTTP/1.1" 200 128 "-" "%s"\n' \
    "${ATTACK_BASE}.${i}" "$TS" "$UA" >>"$LOG"
done
printf '%s - - [%s] "GET /search?q=1%%27+UNION+SELECT+null,null-- HTTP/1.1" 200 128 "-" "%s"\n' \
  "$TRUSTED_IP" "$TS" "$UA" >>"$LOG"

"$LG" "$LOG" --no-tui --rules "$RULES" --no-db >"$OUT" 2>&1 || true

trusted_cluster_ban=0
if grep -qF "[BAN-PIPE] ${TRUSTED_IP} (ja3-cluster" "$OUT"; then
  trusted_cluster_ban=1
fi
flush_seen=0
grep -q '\[JA3-CLUSTER\] flush' "$OUT" && flush_seen=1
ja3_attack_bans=$(grep 'ja3-cluster' "$OUT" | grep -c "${ATTACK_BASE}\." 2>/dev/null || true)
ja3_attack_bans=${ja3_attack_bans:-0}

pass=false
if [[ "$trusted_cluster_ban" -eq 0 ]] && [[ "$flush_seen" -eq 1 ]]; then
  pass=true
fi

python3 - "$REPORT" "$TRUSTED_IP" "$ATTACK_BASE" "$trusted_cluster_ban" "$flush_seen" \
  "$ja3_attack_bans" "$pass" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

out = Path(sys.argv[1])
report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "trusted_ip": sys.argv[2],
    "attack_block": sys.argv[3],
    "trusted_cluster_banned": int(sys.argv[4]) == 1,
    "ja3_cluster_flush": int(sys.argv[5]) == 1,
    "attack_ja3_cluster_bans": int(sys.argv[6]),
    "pass": sys.argv[7] == "true",
    "hint": "Guvenilir IP cluster flush disinda; tekil SQLi WAF ayri kanal",
}
out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(
    f"[fp_cluster_trust_e2e] trusted_cluster_banned={report['trusted_cluster_banned']} "
    f"flush={report['ja3_cluster_flush']} ja3_bans={report['attack_ja3_cluster_bans']} "
    f"pass={report['pass']}"
)
sys.exit(0 if report["pass"] else 1)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
