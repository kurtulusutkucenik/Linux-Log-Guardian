#!/usr/bin/env bash
# SIEM forwarder JSON akisi — alert + ban (yerel TCP 5044)
set -euo pipefail
set +H
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()

LG_BIN="${LG_BIN:-./log-guardian}"
RULES="${LG_RULES:-$ROOT/rules.conf}"
SIEM_FMT="${SIEM_FORMAT:-json}"
# 5044 = prod SIEM_PORT; calisan servisle yarismasin
if [[ "$SIEM_FMT" == "stix" ]]; then
  PORT="${SIEM_CAPTURE_PORT:-15045}"
  ATTACK_IP="203.0.113.211"
else
  PORT="${SIEM_CAPTURE_PORT:-15044}"
  ATTACK_IP="203.0.113.210"
fi
LOG="${LG_SIEM_CAPTURE_LOG:-$ROOT/.cache/siem_export_e2e_${SIEM_FMT}.log}"
ATTACK_LOG="$ROOT/.cache/siem_export_attack_${SIEM_FMT}.access"
CAP_PID=""

free_capture_port() {
  local p="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || true
  elif command -v ss >/dev/null 2>&1; then
    local pid
    pid="$(ss -lptn "sport = :$p" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1 || true)"
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  fi
  sleep 0.4
}

wait_capture_port() {
  local p="$1" n=0
  while [[ $n -lt 24 ]]; do
    if command -v ss >/dev/null 2>&1 && ss -lnt "sport = :$p" 2>/dev/null | grep -q ":$p"; then
      return 0
    fi
    sleep 0.25
    n=$((n + 1))
  done
  fail "capture port $p dinlemiyor"
}

cleanup() {
  if [[ -n "${CAP_PID:-}" ]]; then
    kill "$CAP_PID" 2>/dev/null || true
    wait "$CAP_PID" 2>/dev/null || true
    CAP_PID=""
  fi
  free_capture_port "$PORT"
}
trap cleanup EXIT

fail() { echo "[siem_export_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ -x "$LG_BIN" ]] || fail "log-guardian yok — make -j\$(nproc)"

echo "=== siem_export_e2e (format=${SIEM_FMT}) ==="

free_capture_port "$PORT"
rm -f "$LOG"
python3 "$ROOT/scripts/siem_capture.py" --port "$PORT" --out "$LOG" --timeout 60 &
CAP_PID=$!
if [[ "$SIEM_FMT" == "stix" ]]; then
  sleep 2.0
else
  sleep 1.2
fi
wait_capture_port "$PORT"

mkdir -p "$(dirname "$ATTACK_LOG")"
cat >"$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [09/Jun/2026:02:30:01 +0300] "GET /api?x=<script>alert(1)</script> HTTP/1.1" 403 80 "-" "siem_export_e2e"
${ATTACK_IP} - - [09/Jun/2026:02:30:02 +0300] "GET /admin?id=1 OR 1=1 HTTP/1.1" 404 50 "-" "siem_export_e2e"
EOF

prepare_lg_replay_auth
load_lg_replay_password

# /etc rules.conf SIEM_FORMAT=stix + SIEM_PORT=5044 E2E capture ile celisir — SIEM satirlari probe'dan
mkdir -p "$ROOT/.cache"
E2E_RULES="$ROOT/.cache/siem_e2e_probe_${SIEM_FMT}.rules.conf"
grep -v -E '^(SIEM_FORWARDER_ENABLED|SIEM_HOST|SIEM_PORT|SIEM_FORMAT)=' "$RULES" >"$E2E_RULES"
chmod 600 "$E2E_RULES"

siem_env() {
  env LOGANALYZER_PASSWORD="$LOGANALYZER_PASSWORD" \
    WEBHOOK_DRY_RUN=1 METRICS_PORT=0 LOG_GUARDIAN_SKIP_IPC=1 \
    MESH_BACKEND=none THREAT_FEED_ENABLED=0 SIEM_SYNC_SEND=1 \
    SIEM_FORWARDER_ENABLED=1 SIEM_HOST=127.0.0.1 SIEM_PORT="$PORT" SIEM_FORMAT="$SIEM_FMT" \
    "$@"
}

# 1) Ban once (webhook-test) — alert logdan; ban sadece buradan (--no-ban)
export WEBHOOK_ENABLED=1
export WEBHOOK_TELEGRAM_BOT=0
export LOGANALYZER_TELEGRAM_TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-FAKE:TOKEN}"
export LOGANALYZER_TELEGRAM_CHAT_ID="${LOGANALYZER_TELEGRAM_CHAT_ID:--1001}"

siem_env \
  WEBHOOK_ENABLED=1 WEBHOOK_TELEGRAM_BOT=0 \
  LOGANALYZER_TELEGRAM_TOKEN="$LOGANALYZER_TELEGRAM_TOKEN" \
  LOGANALYZER_TELEGRAM_CHAT_ID="$LOGANALYZER_TELEGRAM_CHAT_ID" \
  "$LG_BIN" "${LG_AUTH_ARGS[@]}" webhook-test ban --rules "$E2E_RULES" >/dev/null

if [[ "$SIEM_FMT" == "stix" ]]; then
  sleep 3
else
  sleep 1
fi

# 2) Alert (attack log) — DB/ban kirletme yok
siem_env WEBHOOK_ENABLED=0 WEBHOOK_TELEGRAM_BOT=0 \
  "$LG_BIN" "${LG_AUTH_ARGS[@]}" "$ATTACK_LOG" --no-tui --json --no-ban --no-db --rules "$E2E_RULES" >/dev/null

[[ -f "$LOG" ]] || fail "capture log yok"

wait_capture() {
  local pat="$1" n=0
  while [[ $n -lt 24 ]]; do
    grep -q "$pat" "$LOG" 2>/dev/null && return 0
    sleep 0.5
    n=$((n + 1))
  done
  return 1
}

if [[ "$SIEM_FMT" == "stix" ]]; then
  wait_capture '"type":"bundle"' || wait_capture 'bundle--lg-' || {
    echo "[siem_export_e2e] capture log: $(wc -c <"$LOG" 2>/dev/null || echo 0) byte" >&2
    [[ -s "$LOG" ]] && tail -3 "$LOG" >&2 || true
    fail "STIX bundle satiri yok"
  }
  ok "STIX bundle"
  wait_capture '"type":"indicator"' || fail "STIX indicator satiri yok"
  ok "STIX indicator (ban/alert)"
else
  wait_capture '"event_type":"alert"' || fail "SIEM alert satiri yok"
  ok "SIEM alert JSON"
  wait_capture '"event_type":"ban"' || fail "SIEM ban satiri yok"
  ok "SIEM ban JSON"
fi

if [[ -n "${CAP_PID:-}" ]]; then
  kill "$CAP_PID" 2>/dev/null || true
  wait "$CAP_PID" 2>/dev/null || true
  CAP_PID=""
fi
free_capture_port "$PORT"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "alert_seen": True,
    "ban_seen": True,
    "format": "${SIEM_FMT}",
    "port": int("${PORT}"),
    "attack_ip": "${ATTACK_IP}",
}
Path("${ROOT}/siem-export-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
PY

echo "[OK] siem_export_e2e"
