#!/usr/bin/env bash
# ops_health.sh — --health retry (BPF/IPC gecikmesi icin)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG" ]] || LG="$ROOT/log-guardian"
[[ -x "$LG" ]] || { echo "[ops_health] log-guardian binary yok" >&2; exit 1; }

RULES="${RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"

TRIES="${HEALTH_TRIES:-5}"
SLEEP_SEC="${HEALTH_SLEEP:-5}"
TIMEOUT_SEC="${HEALTH_TIMEOUT:-20}"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

METRICS_PORT=9091
if [[ -f "$RULES" ]]; then
  mp=$(grep -E '^METRICS_PORT=' "$RULES" 2>/dev/null | cut -d= -f2)
  [[ -n "$mp" ]] && METRICS_PORT="$mp"
fi

echo "[ops_health] binary=$LG rules=$RULES tries=$TRIES"

for i in $(seq 1 "$TRIES"); do
  echo "[ops_health] deneme $i/$TRIES"
  if timeout "$TIMEOUT_SEC" "$LG" --health --rules "$RULES" 2>&1; then
    if curl -sf --max-time 3 "http://127.0.0.1:${METRICS_PORT}/metrics" \
         | grep -q loganalyzer_lines_total; then
      echo "[ops_health] OK — health + /metrics:${METRICS_PORT}"
      exit 0
    fi
    echo "[ops_health] health OK ama /metrics henuz yok"
  else
    rc=$?
    [[ "$rc" -eq 124 ]] && echo "[ops_health] timeout ${TIMEOUT_SEC}s"
  fi
  if [[ "$i" -lt "$TRIES" ]]; then
    sleep "$SLEEP_SEC"
    if command -v systemctl &>/dev/null; then
      systemctl start log-guardian-daemon 2>/dev/null || true
      systemctl start log-guardian 2>/dev/null || true
    fi
  fi
done

echo "[ops_health] FAIL — $TRIES deneme sonrasi" >&2
echo "  ipucu: sudo systemctl restart log-guardian-daemon log-guardian" >&2
echo "  ipucu: sudo bash scripts/fix_ipc_perms.sh" >&2
exit 1
