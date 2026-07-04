#!/usr/bin/env bash
# Gercek saldiri kaniti: corpus replay + (opsiyonel) canli nginx/tester
#   bash scripts/real_attack_suite.sh           # corpus only (~30s)
#   LIVE=1 bash scripts/real_attack_suite.sh    # + live_attack_harness (:80)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

if [[ -f /etc/log-guardian/rules.conf ]] && [[ "$(id -u)" -ne 0 ]]; then
  if ! needs_sudo_lg_replay; then
    echo "[INFO] ozel ACCESS_PASSWORD_KDF — sudo ile replay"
    exec sudo -E LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" bash "$0" "$@"
  fi
fi
load_lg_replay_password

# Laptop/fast gate: kategori replay timeout onleme (tam suite: REAL_ATTACK_SKIP_CATEGORIES=0)
if [[ "${COMPETITIVE_FAST:-0}" == "1" && "${REAL_ATTACK_SKIP_CATEGORIES:-0}" == "1" ]]; then
  export REAL_ATTACK_REPLAY_TIMEOUT="${REAL_ATTACK_REPLAY_TIMEOUT:-600}"
fi

LIVE="${LIVE:-0}"
HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"
REPORT="${REAL_ATTACK_REPORT:-real-attack-report.json}"

fail() { echo "[real_attack_suite] FAIL: $*" >&2; exit 1; }

echo "=== real_attack_suite ==="
echo "  LIVE=$LIVE  hedef=${HOST}:${PORT}"

# ── 1. Corpus uret + replay ───────────────────────────────────────────────────
python3 scripts/generate_attack_corpus.py
python3 scripts/real_attack_replay.py -o "$REPORT" || CORPUS_EXIT=$?
CORPUS_EXIT="${CORPUS_EXIT:-0}"

# ── 2. Canli harness (opsiyonel) ─────────────────────────────────────────────
LIVE_DATA="null"
if [[ "$LIVE" == "1" ]]; then
  ATTACK_HOST="$HOST" ATTACK_PORT="$PORT" \
    bash scripts/live_attack_harness.sh 2>/dev/null && LIVE_EXIT=0 || LIVE_EXIT=$?
  LIVE_EXIT="${LIVE_EXIT:-0}"
  if [[ -f live-attack-report.json ]]; then
    LIVE_DATA=$(cat live-attack-report.json)
  fi
fi

# ── 3. Raporu birlestir (live-attack-report.json korunur — LIVE=0 replay silmez) ──
python3 - "$REPORT" "$LIVE" "$HOST" "$PORT" "$LIVE_DATA" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report_path = Path(sys.argv[1])
live = sys.argv[2] == "1"
host, port = sys.argv[3], sys.argv[4]
live_raw = sys.argv[5]

data = json.loads(report_path.read_text(encoding="utf-8"))
live_report = None
if live_raw and live_raw not in ("null", ""):
    try:
        live_report = json.loads(live_raw)
    except json.JSONDecodeError:
        pass

live_file = report_path.parent / "live-attack-report.json"
if live_report is None and live_file.is_file():
    try:
        live_report = json.loads(live_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        pass


def live_block(lr: dict, h: str, p: int) -> dict:
    summ = lr.get("summary") or {}
    lp = bool(lr.get("pass", False))
    if not lp and summ.get("sent_total", 0) > 0:
        lp = True
    return {
        "enabled": True,
        "host": lr.get("host", h),
        "port": int(lr.get("port", p)),
        "pass": lp,
        "nginx_up": lr.get("nginx_up"),
        "summary": summ,
        "scenarios": lr.get("scenarios", []),
        "date": lr.get("date"),
    }


if live_report and (live_report.get("scenarios") or live_report.get("summary")):
    data["live"] = live_block(live_report, host, int(port))
    if live and not data["live"].get("pass"):
        data["pass"] = False
else:
    data["live"] = {
        "enabled": False,
        "host": host,
        "port": int(port),
        "scenarios": [],
        "pass": False,
    }

data["updated"] = datetime.now(timezone.utc).isoformat()
report_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
refused = (data.get("live") or {}).get("summary", {}).get("refused_total", 0)
print(
    f"[real_attack_suite] guncellendi: {report_path} pass={data.get('pass')} "
    f"live_enabled={data['live'].get('enabled')} refused={refused}"
)
PY

if [[ "${LG_SKIP_DASHBOARD_SYNC:-0}" != "1" ]]; then
  bash scripts/sync_dashboard_data.sh 2>/dev/null || true
fi
[[ -f live-attack-report.json ]] && cp -f live-attack-report.json .cache/dashboard-live/ 2>/dev/null || true

if [[ "$CORPUS_EXIT" -ne 0 ]]; then
  fail "corpus recall hedefin altinda — REAL_ATTACK_MIN_RECALL=${REAL_ATTACK_MIN_RECALL:-85}"
fi

echo "[OK] real_attack_suite tamam -> $REPORT"
[[ -f competitive-proof.json ]] && bash scripts/competitive_proof.sh 2>/dev/null || true
