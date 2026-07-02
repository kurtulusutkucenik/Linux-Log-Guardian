#!/usr/bin/env bash
# Telegram inline (WL / Sessiz / Unban) etkisini geri al — bildirimler tekrar sesli
#   bash scripts/telegram_operator_undo.sh
#   bash scripts/telegram_operator_undo.sh 203.0.113.198
#   REBAN=1 bash scripts/telegram_operator_undo.sh   # unban sonrasi tekrar ban (demo)
#   FORCE_RESTART=1 bash scripts/telegram_operator_undo.sh  # SIGUSR2 yerine restart
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh" 2>/dev/null || true

IP="${1:-203.0.113.198}"
REBAN="${REBAN:-0}"
FORCE_RESTART="${FORCE_RESTART:-0}"
LG="${LG_BIN:-/usr/local/bin/log-guardian}"
UNDO_FILE="/run/log-guardian/telegram_undo.ip"
IPSET="${IPSET_NAME:-log_analyzer_block_v4}"

fail() { echo "[telegram_operator_undo] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

ipset_has() {
  local ip="$1"
  ipset test "$IPSET" "$ip" >/dev/null 2>&1 \
    || sudo -n ipset test "$IPSET" "$ip" >/dev/null 2>&1
}

run_ban() {
  local out rc=0
  if [[ "$(id -u)" -eq 0 ]]; then
    out=$("$LG" ban "$IP" --reason "operator-undo-reban" 2>&1) || rc=$?
  else
    out=$(sudo "$LG" ban "$IP" --reason "operator-undo-reban" 2>&1) || rc=$?
  fi
  if [[ "$rc" -ne 0 ]]; then
    warn "ban CLI rc=$rc: $out"
    return 1
  fi
  echo "$out"
  return 0
}

undo_via_usr2() {
  local pid
  pid=$(systemctl show -p MainPID --value log-guardian.service 2>/dev/null || echo 0)
  [[ -n "$pid" && "$pid" != "0" ]] || return 1

  if [[ "$(id -u)" -eq 0 ]]; then
    printf '%s\n' "$IP" >"$UNDO_FILE"
    kill -USR2 "$pid"
  elif sudo -n tee "$UNDO_FILE" >/dev/null <<<"$IP" 2>/dev/null \
      && sudo -n kill -USR2 "$pid" 2>/dev/null; then
    :
  else
    printf '%s\n' "$IP" | sudo tee "$UNDO_FILE" >/dev/null
    sudo kill -USR2 "$pid"
  fi
  sleep 1
  if journalctl -u log-guardian.service -b --no-pager 2>/dev/null \
      | tail -20 | grep -q "\[TELEGRAM_UNDO\] $IP"; then
    return 0
  fi
  return 1
}

restart_svc() {
  if systemctl restart log-guardian.service 2>/dev/null; then
    return 0
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    systemctl restart log-guardian.service
    return 0
  fi
  sudo systemctl restart log-guardian.service
}

echo "=== telegram_operator_undo ==="
echo "  IP=$IP"
echo ""

if [[ "$FORCE_RESTART" == "1" ]]; then
  warn "FORCE_RESTART=1 — servis yeniden baslatiliyor"
  restart_svc
  sleep 2
  ok "log-guardian restart — WL + sessiz mod temizlendi"
elif undo_via_usr2; then
  ok "SIGUSR2 — runtime WL + sessiz mod temizlendi (poll kesintisiz)"
else
  warn "SIGUSR2 yok/eski binary — restart fallback"
  restart_svc
  sleep 2
  ok "log-guardian restart — WL + sessiz mod temizlendi"
fi

if ! systemctl is-active log-guardian.service >/dev/null 2>&1; then
  fail "log-guardian.service ayakta degil"
fi

if [[ "$REBAN" == "1" ]]; then
  if [[ -x "$LG" ]]; then
    if run_ban; then
      if ipset_has "$IP"; then
        ok "REBAN=1 — $IP ipset'te"
      else
        warn "REBAN CLI OK ama ipset'te gorunmuyor — IPC izinleri?"
      fi
    else
      warn "REBAN basarisiz — sudo log-guardian ban $IP"
    fi
  else
    warn "REBAN atlandi — $LG yok"
  fi
else
  echo "  Unban duruyor — tekrar ban: REBAN=1 bash scripts/telegram_operator_undo.sh $IP"
fi

if journalctl -u log-guardian.service -b --no-pager 2>/dev/null \
    | tail -8 | grep -q 'long-poll acik'; then
  ok "Telegram bot poll aktif"
fi

echo "[OK] telegram_operator_undo tamam"
