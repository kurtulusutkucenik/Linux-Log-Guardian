#!/usr/bin/env bash
# guardian-status.json — webhook.env token ile (telegram LIVE rozeti icin)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

OUT="${GUARDIAN_STATUS_JSON:-guardian-status.json}"
RULES="${GUARDIAN_STATUS_RULES:-rules.conf}"
DB="${GUARDIAN_STATUS_DB:-events.db}"
WEBHOOK_ENV="/etc/log-guardian/webhook.env"

if [[ -f /etc/log-guardian/rules.conf ]]; then
  RULES="/etc/log-guardian/rules.conf"
fi
if [[ -f /etc/log-guardian/events.db ]]; then
  DB="/etc/log-guardian/events.db"
fi

LG_QUIET_BUILD=1 make -s log-guardian 2>/dev/null || true
LG="./log-guardian"

run_status() {
  "$LG" --status --quiet --rules "$RULES" --db "$DB"
}

status_json_valid() {
  python3 - "$OUT" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
if not p.is_file():
    sys.exit(1)
try:
    d = json.loads(p.read_text(encoding="utf-8"))
except (json.JSONDecodeError, OSError):
    sys.exit(1)
sys.exit(0 if d.get("ipc") in ("ok", "connected") else 1)
PY
}

write_status_from_stdout() {
  local raw="$1"
  python3 - "$OUT" "$raw" <<'PY'
import json, sys
from pathlib import Path
out = Path(sys.argv[1])
raw = sys.argv[2]
for line in reversed(raw.splitlines()):
    line = line.strip()
    if not line.startswith("{"):
        continue
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    if d.get("ipc") not in ("ok", "connected"):
        continue
    out.write_text(json.dumps(d, ensure_ascii=False) + "\n", encoding="utf-8")
    sys.exit(0)
sys.exit(1)
PY
}

capture_status() {
  local raw
  raw="$(run_status 2>/dev/null || true)"
  write_status_from_stdout "$raw"
}

ensure_daemon_ipc() {
  if "$LG" --health 2>/dev/null | grep -q 'daemon IPC: OK'; then
    return 0
  fi
  if ! command -v systemctl >/dev/null 2>&1; then
    return 1
  fi
  echo "[guardian_status_export] daemon IPC yok — yeniden baslatiliyor..." >&2
  systemctl restart log-guardian-daemon.service 2>/dev/null \
    || sudo -n systemctl restart log-guardian-daemon.service 2>/dev/null \
    || systemctl start log-guardian-daemon.service 2>/dev/null \
    || sudo -n systemctl start log-guardian-daemon.service 2>/dev/null \
    || true
  for _ in $(seq 1 15); do
    sleep 1
    if "$LG" --health 2>/dev/null | grep -q 'daemon IPC: OK'; then
      return 0
    fi
  done
  return 1
}

export_status() {
  ensure_daemon_ipc || true
  local attempt
  for attempt in 1 2 3 4 5 6; do
    if capture_status; then
      echo "[guardian_status_export] $OUT (rules=$RULES, attempt=$attempt)"
      return 0
    fi
    sleep 2
  done
  return 1
}

export_with_webhook_env() {
  local envf="$1"
  local raw
  raw="$(
    (
      set -a
      # shellcheck disable=SC1090
      source "$envf"
      set +a
      run_status
    ) 2>/dev/null || true
  )"
  write_status_from_stdout "$raw"
}

write_fallback() {
  if status_json_valid 2>/dev/null; then
    echo "[WARN] status export basarisiz — mevcut ipc=ok korunuyor" >&2
    return 0
  fi
  if "$LG" --health 2>/dev/null | grep -q 'daemon IPC: OK'; then
    echo "[guardian_status_export] son deneme (health IPC OK)..." >&2
  fi
  if capture_status; then
    echo "[guardian_status_export] $OUT (rules=$RULES, recovery)"
    return 0
  fi
  echo '{"ipc":"fail","xdp_mode":"unknown","ban_pipeline":{"ipc":0,"xdp":0,"ipset":0,"failed":0}}' >"$OUT"
  echo "[WARN] status export fallback" >&2
}

if [[ -f "$WEBHOOK_ENV" && -r "$WEBHOOK_ENV" ]]; then
  if export_with_webhook_env "$WEBHOOK_ENV"; then
    echo "[guardian_status_export] $OUT (rules=$RULES, webhook.env)"
    exit 0
  fi
fi

if [[ -f "$WEBHOOK_ENV" ]] && command -v sudo >/dev/null 2>&1 \
    && sudo -n test -r "$WEBHOOK_ENV" 2>/dev/null; then
  raw="$(sudo -n bash -c "
set -a
source '$WEBHOOK_ENV'
set +a
cd '$ROOT'
export LOGANALYZER_PASSWORD='${LOGANALYZER_PASSWORD}'
'$LG' --status --quiet --rules '$RULES' --db '$DB'
" 2>/dev/null || true)"
  if write_status_from_stdout "$raw"; then
    echo "[guardian_status_export] $OUT (rules=$RULES, webhook.env via sudo)"
    exit 0
  fi
fi

if export_status; then
  echo "[WARN] webhook.env okunamadi — telegram=false olabilir (sudo ile tekrar)" >&2
  exit 0
fi

write_fallback
