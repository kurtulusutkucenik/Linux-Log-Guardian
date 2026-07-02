#!/usr/bin/env bash
# Corpus replay: --no-webhook rules.conf sonrasi da gecerli; --no-ban alert≠ban ayrimi
#   bash scripts/proof_replay_webhook_ban.sh
#   sudo bash scripts/proof_replay_webhook_ban.sh   # ipset ban fazasi dahil
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

REPORT="${PROOF_REPLAY_REPORT:-proof-replay-webhook-ban.json}"
CACHE="$ROOT/.cache"
AUDIT="$CACHE/proof-replay-audit.jsonl"
IP_BASE="${PROOF_REPLAY_IP_BASE:-211}"
IP_COUNT="${PROOF_REPLAY_IP_COUNT:-4}"
RUN_BAN="${PROOF_REPLAY_BAN:-auto}"  # auto|1|0

fail() { echo "[proof_replay] FAIL: $*" >&2; exit 1; }

ensure_lg_build_tree "$ROOT"
[[ -x ./log-guardian ]] || make -s -j1 log-guardian

LG="${LG_BIN:-}"
if [[ -z "$LG" && -x "$ROOT/log-guardian" ]]; then
  LG="$ROOT/log-guardian"
elif [[ -z "$LG" && -x /usr/local/bin/log-guardian ]]; then
  LG=/usr/local/bin/log-guardian
else
  LG="./log-guardian"
fi

SRC_RULES="/etc/log-guardian/rules.conf"
[[ -f "$SRC_RULES" && -r "$SRC_RULES" ]] || SRC_RULES="$ROOT/rules.conf"
[[ -f "$SRC_RULES" ]] || fail "rules.conf bulunamadi"

mkdir -p "$CACHE"
RULES=$(mktemp)
LOG=$(mktemp)
PWFILE=$(mktemp)
STDERR_A=$(mktemp)
STDERR_B=$(mktemp)
trap 'rm -f "$RULES" "$LOG" "$PWFILE" "$STDERR_A" "$STDERR_B"' EXIT

printf '%s\n' 'DegistirBeni!123' >"$PWFILE"
chmod 600 "$PWFILE"
LG_AUTH=(--password-file "$PWFILE")

DEMO_KDF='ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504'
RULES_BASE="$(cd "$(dirname "$SRC_RULES")" && pwd)"

# Prod kurallar + demo KDF (replay sudo gerektirmez) + WEBHOOK_ENABLED=1 regresyonu
{
  while IFS= read -r ln || [[ -n "$ln" ]]; do
    case "$ln" in
      BLOCK_COUNTRIES=*|ACCESS_PASSWORD_KDF=*|WEBHOOK_ENABLED=*|GENERIC_WEBHOOK_URL=*|METRICS_PORT=*|DB_ENABLED=*|BAN_POLICY_AUDIT=*)
        continue ;;
      CRS_RULES=*|OPENAPI_SCHEMA=*|FALCO_HOST_RULES=*|WASM_PLUGIN_DIR=*)
        key="${ln%%=*}"
        val="${ln#*=}"
        if [[ -n "$val" && "$val" != /* ]]; then
          ln="${key}=${RULES_BASE}/${val}"
        fi
        ;;
    esac
    printf '%s\n' "$ln"
  done <"$SRC_RULES"
  echo "$DEMO_KDF"
  echo "WEBHOOK_ENABLED=1"
  echo "GENERIC_WEBHOOK_URL=https://dry-run.invalid/log-guardian-proof"
  echo "WEBHOOK_MIN_LEVEL=2"
  echo "WEBHOOK_COOLDOWN_SEC=1"
  echo "METRICS_PORT=0"
  echo "DB_ENABLED=0"
  echo "BAN_POLICY_AUDIT=$AUDIT"
} >"$RULES"
chmod 600 "$RULES"

TS='[15/Jun/2026:22:30:00 +0300]'
: >"$LOG"
for i in $(seq 0 $((IP_COUNT - 1))); do
  ip="203.0.113.$((IP_BASE + i))"
  printf '%s - - %s "GET /api/proof/schema-violation-%d HTTP/1.1" 404 0 "-" "proof_replay_webhook_ban"\n' \
    "$ip" "$TS" "$i" >>"$LOG"
done

dry_run_count() {
  grep -c '\[WEBHOOK\]\[DRY-RUN\]' "$1" 2>/dev/null | head -1 || true
}

# Root olsa bile sandbox/CI'da ipset kernel'e erisemeyebilir — faz3'i atla
ipset_usable() {
  command -v ipset >/dev/null 2>&1 || return 1
  ipset list -n log_analyzer_block_v4 >/dev/null 2>&1 || return 1
  return 0
}

echo "=== proof_replay_webhook_ban ==="
echo "  lg=$LG  rules=$SRC_RULES  ips=203.0.113.${IP_BASE}+ (${IP_COUNT} satir)"

# ── Faz 1: --no-ban --no-webhook → alert var, Telegram yok, audit banned:false
rm -f "$AUDIT"
JSON_A=$(WEBHOOK_DRY_RUN=1 "$LG" "$LOG" --no-tui --json --no-ban --no-webhook \
  --no-db --rules "$RULES" "${LG_AUTH[@]}" 2>"$STDERR_A" || true)
DRY_A=$(dry_run_count "$STDERR_A")
DRY_A=${DRY_A:-0}
ALERTS_A=$(echo "$JSON_A" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('alerts_total',0))" 2>/dev/null || echo 0)

AUDIT_NO_BAN=0
FORCE_WAF=0
if [[ -f "$AUDIT" ]]; then
  read -r AUDIT_NO_BAN FORCE_WAF <<< "$(python3 - "$AUDIT" <<'PY'
import json, sys
from pathlib import Path
lines = [json.loads(x) for x in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines() if x.strip()]
nb = sum(1 for r in lines if r.get("banned") is False)
fw = sum(1 for r in lines if r.get("decision") == "force_waf")
print(nb, fw)
PY
)"
fi

webhook_suppressed=0
[[ "${DRY_A:-0}" -eq 0 ]] && webhook_suppressed=1

no_ban_ok=0
if [[ "${ALERTS_A:-0}" -ge "$IP_COUNT" && "$webhook_suppressed" -eq 1 && "${FORCE_WAF:-0}" -ge 1 ]]; then
  no_ban_ok=1
fi
if [[ "${ALERTS_A:-0}" -lt "$IP_COUNT" && -s "$STDERR_A" ]]; then
  echo "[proof_replay] faz1 stderr (auth/schema?):" >&2
  grep -E '^\[ERISIM\]|^\[SCHEMA\]|^\[HATA\]|^\[ERR\]' "$STDERR_A" | tail -5 >&2 || tail -3 "$STDERR_A" >&2
fi
echo "[proof_replay] faz1 no-ban+no-webhook: alerts=${ALERTS_A} dry_run=${DRY_A} force_waf=${FORCE_WAF:-0} pass=${no_ban_ok}"

# ── Faz 2: kontrol — --no-webhook yok, WEBHOOK_DRY_RUN ile en az 1 kuyruk
rm -f "$AUDIT"
WEBHOOK_DRY_RUN=1 "$LG" "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" \
  "${LG_AUTH[@]}" >/dev/null 2>"$STDERR_B" || true
DRY_B=$(dry_run_count "$STDERR_B")
DRY_B=${DRY_B:-0}
webhook_control_ok=0
[[ "${DRY_B:-0}" -ge 1 ]] && webhook_control_ok=1
echo "[proof_replay] faz2 webhook kontrol: dry_run=${DRY_B} pass=${webhook_control_ok}"

# ── Faz 3: ban acik (--no-webhook) → force_waf + ipset (root)
ban_ok=0
ban_skipped=0
ipset_hits=0
BAN_JSON=""
if [[ "$RUN_BAN" == "0" ]]; then
  ban_skipped=1
  echo "[proof_replay] faz3 ban atlandi (PROOF_REPLAY_BAN=0)"
elif [[ "$(id -u)" -ne 0 ]]; then
  ban_skipped=1
  echo "[WARN] faz3 ban — sudo gerekli (sudo bash $0)" >&2
elif ! ipset_usable; then
  ban_skipped=1
  echo "[proof_replay] faz3 ban atlandi (ipset kullanilamiyor — sandbox veya modprobe?)" >&2
else
  for i in $(seq 0 $((IP_COUNT - 1))); do
    ip="203.0.113.$((IP_BASE + i))"
    "$LG" unban "$ip" >/dev/null 2>&1 || true
    ipset del log_analyzer_block_v4 "$ip" 2>/dev/null || true
  done
  rm -f "$AUDIT"
  BAN_JSON=$(WEBHOOK_DRY_RUN=1 "$LG" "$LOG" --no-tui --json --no-webhook \
    --no-db --rules "$RULES" "${LG_AUTH[@]}" 2>/dev/null || true)
  for i in $(seq 0 $((IP_COUNT - 1))); do
    ip="203.0.113.$((IP_BASE + i))"
    if ipset test log_analyzer_block_v4 "$ip" 2>/dev/null; then
      ipset_hits=$((ipset_hits + 1))
    fi
  done
  banned_audit=0
  if [[ -f "$AUDIT" ]]; then
    banned_audit=$(python3 - "$AUDIT" <<'PY'
import json, sys
from pathlib import Path
lines = [json.loads(x) for x in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines() if x.strip()]
print(sum(1 for r in lines if r.get("banned") is True))
PY
)
  fi
  json_banned=$(echo "$BAN_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(sum(1 for x in d.get('top_10',[]) if x.get('banned')))
" 2>/dev/null || echo 0)
  if [[ "$ipset_hits" -ge "$IP_COUNT" || "${banned_audit:-0}" -ge "$IP_COUNT" || "${json_banned:-0}" -ge "$IP_COUNT" ]]; then
    ban_ok=1
  fi
  echo "[proof_replay] faz3 ban acik: ipset=${ipset_hits}/${IP_COUNT} audit_banned=${banned_audit:-0} pass=${ban_ok}"
fi

pass=0
if [[ "$no_ban_ok" -eq 1 && "$webhook_control_ok" -eq 1 ]]; then
  if [[ "$ban_skipped" -eq 1 ]]; then
    pass=1
  elif [[ "$ban_ok" -eq 1 ]]; then
    pass=1
  fi
fi

python3 - "$REPORT" "$IP_BASE" "$IP_COUNT" "$ALERTS_A" "$DRY_A" "$DRY_B" \
  "$no_ban_ok" "$webhook_control_ok" "$ban_ok" "$ban_skipped" "$ipset_hits" "$pass" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

out = Path(sys.argv[1])
ip_base = int(sys.argv[2])
count = int(sys.argv[3])
data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": "corpus replay proof",
    "ip_block": f"203.0.113.{ip_base}-203.0.113.{ip_base + count - 1}",
    "lines": count,
    "phase1_no_ban_no_webhook": {
        "alerts_total": int(sys.argv[4]),
        "webhook_dry_run_lines": int(sys.argv[5]),
        "pass": int(sys.argv[7]) == 1,
    },
    "phase2_webhook_control": {
        "webhook_dry_run_lines": int(sys.argv[6]),
        "pass": int(sys.argv[8]) == 1,
    },
    "phase3_ban_enabled": {
        "skipped": int(sys.argv[10]) == 1,
        "ipset_hits": int(sys.argv[11]),
        "pass": int(sys.argv[9]) == 1,
    },
    "pass": int(sys.argv[12]) == 1,
    "note": "faz1: corpus replay Telegram kapali; faz3: force_waf ile ipset (prod davranisi)",
}
out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[proof_replay] alerts={data['phase1_no_ban_no_webhook']['alerts_total']} "
      f"dry0={data['phase1_no_ban_no_webhook']['webhook_dry_run_lines']} "
      f"dry_ctrl={data['phase2_webhook_control']['webhook_dry_run_lines']} "
      f"ipset={data['phase3_ban_enabled']['ipset_hits']}/{count} pass={data['pass']}")
sys.exit(0 if data["pass"] else 1)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true

[[ "$pass" -eq 1 ]] || fail "regresyon — proof-replay-webhook-ban.json"
echo "[OK] proof_replay_webhook_ban -> $REPORT"
