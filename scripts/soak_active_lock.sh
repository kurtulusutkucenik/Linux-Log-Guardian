#!/usr/bin/env bash
# Soak kilidi — upgrade/restart onleme (calisan soak varken)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="${SOAK_LOCK_FILE:-$ROOT/.cache/soak-active.lock}"
PIDFILE="${SOAK_PIDFILE:-$ROOT/.cache/soak-72h.pid}"

soak_running() {
  [[ -f "$PIDFILE" ]] || return 1
  local pid
  pid=$(cat "$PIDFILE" 2>/dev/null || true)
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

soak_write_lock() {
  local pid="${1:-?}" label="${2:-soak}"
  mkdir -p "$(dirname "$LOCK")"
  cat >"$LOCK" <<EOF
pid=$pid
label=$label
started=$(date -Iseconds)
note=Soak bitene kadar upgrade_log_guardian_binary ve systemctl restart yapmayin
EOF
}

soak_clear_lock() {
  rm -f "$LOCK" "$PIDFILE" 2>/dev/null || true
}

soak_refuse_if_running() {
  local force="${1:-0}"
  if ! soak_running; then
    return 0
  fi
  local pid
  pid=$(cat "$PIDFILE" 2>/dev/null || echo "?")
  if [[ "$force" == "1" ]]; then
    echo "[soak_lock] WARN: soak calisiyor (pid=$pid) — UPGRADE_FORCE=1 ile devam" >&2
    return 0
  fi
  echo "[soak_lock] FAIL: soak calisiyor (pid=$pid)" >&2
  echo "  Izleme: tail -f $ROOT/soak-72h.log" >&2
  echo "  Durum:  bash scripts/soak_status.sh" >&2
  echo "  Zorla:  UPGRADE_FORCE=1 sudo bash scripts/upgrade_log_guardian_binary.sh" >&2
  return 1
}

case "${1:-}" in
  write) soak_write_lock "${2:-}" "${3:-soak}" ;;
  clear) soak_clear_lock ;;
  check) soak_refuse_if_running "${2:-0}" ;;
  running) soak_running ;;
  *) echo "usage: soak_active_lock.sh {write|clear|check|running}" >&2; exit 1 ;;
esac
