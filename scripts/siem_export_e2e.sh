#!/usr/bin/env bash
# SIEM forwarder JSON akisi — alert + ban (yerel TCP 5044)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_BIN="${LG_BIN:-./log-guardian}"
RULES="${LG_RULES:-$ROOT/rules.conf}"
PORT="${SIEM_CAPTURE_PORT:-5044}"
LOG="${LG_SIEM_CAPTURE_LOG:-$ROOT/.cache/siem_export_e2e.log}"
ATTACK_IP="203.0.113.210"
ATTACK_LOG="$ROOT/.cache/siem_export_attack.access"
CAP_PID=""

cleanup() {
  [[ -n "$CAP_PID" ]] && kill "$CAP_PID" 2>/dev/null || true
}
trap cleanup EXIT

fail() { echo "[siem_export_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ -x "$LG_BIN" ]] || fail "log-guardian yok — make -j\$(nproc)"

echo "=== siem_export_e2e ==="

rm -f "$LOG"
python3 "$ROOT/scripts/siem_capture.py" --port "$PORT" --out "$LOG" --timeout 60 &
CAP_PID=$!
sleep 0.6

mkdir -p "$(dirname "$ATTACK_LOG")"
cat >"$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [09/Jun/2026:02:30:01 +0300] "GET /api?x=<script>alert(1)</script> HTTP/1.1" 403 80 "-" "siem_export_e2e"
${ATTACK_IP} - - [09/Jun/2026:02:30:02 +0300] "GET /admin?id=1 OR 1=1 HTTP/1.1" 404 50 "-" "siem_export_e2e"
EOF

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export WEBHOOK_ENABLED=0
export WEBHOOK_DRY_RUN=1
export METRICS_PORT=0
export SIEM_FORWARDER_ENABLED=1
export SIEM_HOST=127.0.0.1
export SIEM_PORT="$PORT"

env LOGANALYZER_PASSWORD="$LOGANALYZER_PASSWORD" \
  WEBHOOK_ENABLED=0 WEBHOOK_DRY_RUN=1 METRICS_PORT=0 \
  SIEM_FORWARDER_ENABLED=1 SIEM_HOST=127.0.0.1 SIEM_PORT="$PORT" \
  "$LG_BIN" "$ATTACK_LOG" --no-tui --json --rules "$RULES" >/dev/null

export WEBHOOK_ENABLED=1
export LOGANALYZER_TELEGRAM_TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-FAKE:TOKEN}"
export LOGANALYZER_TELEGRAM_CHAT_ID="${LOGANALYZER_TELEGRAM_CHAT_ID:--1001}"

env LOGANALYZER_PASSWORD="$LOGANALYZER_PASSWORD" \
  WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=1 METRICS_PORT=0 \
  SIEM_FORWARDER_ENABLED=1 SIEM_HOST=127.0.0.1 SIEM_PORT="$PORT" \
  LOGANALYZER_TELEGRAM_TOKEN="$LOGANALYZER_TELEGRAM_TOKEN" \
  LOGANALYZER_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_ID" \
  "$LG_BIN" webhook-test ban --rules "$RULES" >/dev/null

sleep 2
kill "$CAP_PID" 2>/dev/null || true
CAP_PID=""
wait "$CAP_PID" 2>/dev/null || true

[[ -f "$LOG" ]] || fail "capture log yok"
grep -q '"event_type":"alert"' "$LOG" || fail "SIEM alert satiri yok"
ok "SIEM alert JSON"
grep -q '"event_type":"ban"' "$LOG" || fail "SIEM ban satiri yok"
ok "SIEM ban JSON"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "alert_seen": True,
    "ban_seen": True,
    "port": int("${PORT}"),
    "attack_ip": "${ATTACK_IP}",
}
Path("${ROOT}/siem-export-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
PY

echo "[OK] siem_export_e2e"
