#!/usr/bin/env bash
# Günlük sabah kapısı + haftalık core kanıt yenileme cron
#   bash scripts/install_operator_cron.sh
#   bash scripts/install_operator_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_MORNING="${LG_MORNING_GATE_LOG:-$HOME/lg-morning-operator-gate.log}"
LOG_CORE="${LG_CORE_PROOF_LOG:-$HOME/lg-core-proof-refresh.log}"

MARK_MORNING="# log-guardian-morning-operator-gate"
MARK_CORE="# log-guardian-core-proof-refresh"
MARK_PRUNE="# log-guardian-intel-ban-db-prune"
MARK_SECURITY="# log-guardian-security-weekly"
MARK_STRICT="# log-guardian-post-install-strict"
MARK_FLEET_CMDS="# log-guardian-fleet-prune-cmds"
LOG_PRUNE="${LG_INTEL_BAN_PRUNE_LOG:-$HOME/lg-intel-ban-db-prune.log}"
LOG_FLEET_CMDS="${LG_FLEET_PRUNE_CMDS_LOG:-$HOME/lg-fleet-prune-cmds.log}"
LOG_SECURITY="${LG_SECURITY_WEEKLY_LOG:-$HOME/lg-operator-security-weekly.log}"
LOG_STRICT="${LG_POST_INSTALL_STRICT_LOG:-$HOME/lg-post-install-strict.log}"

check_webhook_env_perms() {
  local f perms
  for f in /etc/log-guardian/webhook.env "$ROOT/.env.webhook.local"; do
    if [[ -f "$f" ]]; then
      perms=$(stat -c '%a' "$f" 2>/dev/null || stat -f '%OLp' "$f" 2>/dev/null || echo "?")
      if [[ "$perms" == "600" ]]; then
        echo "[OK] webhook env chmod 600: $f"
      else
        echo "[WARN] $f izin=$perms (beklenen 600) — sudo chmod 600 $f" >&2
        echo "  Telegram sabah uyarisi okunamayabilir — docs/WEBHOOK_SETUP.md" >&2
      fi
      return 0
    fi
  done
  echo "[WARN] webhook.env yok — operator Telegram uyarisi sessiz kalir (docs/WEBHOOK_SETUP.md)" >&2
}

crontab_for_user() {
  if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
    sudo -u "$SUDO_USER" crontab "$@"
  else
    crontab "$@"
  fi
}

crontab_list() {
  crontab_for_user -l 2>/dev/null || true
}

if [[ "${1:-}" == "--remove" ]]; then
  crontab_list | grep -v "$MARK_MORNING" | grep -v "$MARK_CORE" | grep -v "$MARK_PRUNE" | grep -v "$MARK_SECURITY" | grep -v "$MARK_STRICT" | grep -v "$MARK_FLEET_CMDS" | crontab_for_user - 2>/dev/null || true
  echo "[OK] operator cron kaldirildi"
  exit 0
fi

check_webhook_env_perms

LINE_MORNING="0 8 * * * cd \"$ROOT\" && export LOGANALYZER_PASSWORD=\"\${LOGANALYZER_PASSWORD:-DegistirBeni!123}\" SKIP_DASHBOARD_REFRESH=1 && bash scripts/morning_operator_chain.sh >>\"$LOG_MORNING\" 2>&1 $MARK_MORNING"
LINE_CORE="0 3 * * 0 cd \"$ROOT\" && bash scripts/core_proof_refresh.sh >>\"$LOG_CORE\" 2>&1 $MARK_CORE"
LINE_PRUNE="30 4 * * 0 cd \"$ROOT\" && bash scripts/intel_ban_db_prune_cron.sh >>\"$LOG_PRUNE\" 2>&1 $MARK_PRUNE"
LINE_SECURITY="0 6 * * 1 cd \"$ROOT\" && bash scripts/operator_security_weekly.sh >>\"$LOG_SECURITY\" 2>&1 $MARK_SECURITY"
LINE_STRICT="0 5 1 * * cd \"$ROOT\" && bash scripts/operator_post_install_strict.sh >>\"$LOG_STRICT\" 2>&1 $MARK_STRICT"
LINE_FLEET_CMDS="15 3 * * 0 cd \"$ROOT\" && STALE_HOURS=48 bash scripts/fleet_prune_pending_commands.sh >>\"$LOG_FLEET_CMDS\" 2>&1 $MARK_FLEET_CMDS"

( crontab_list | grep -v "$MARK_MORNING" | grep -v "$MARK_CORE" | grep -v "$MARK_PRUNE" | grep -v "$MARK_SECURITY" | grep -v "$MARK_STRICT" | grep -v "$MARK_FLEET_CMDS" || true
  echo "$LINE_MORNING"
  echo "$LINE_CORE"
  echo "$LINE_FLEET_CMDS"
  echo "$LINE_PRUNE"
  echo "$LINE_SECURITY"
  echo "$LINE_STRICT"
) | crontab_for_user -

echo "[OK] install_operator_cron"
echo "  Her gun 08:00 — morning_operator_chain (SKIP_DASHBOARD_REFRESH=1) -> $LOG_MORNING"
echo "  Pazar 03:00 — core_proof_refresh -> $LOG_CORE"
echo "  Pazar 03:15 — fleet_prune_pending_commands (STALE_HOURS=48) -> $LOG_FLEET_CMDS"
echo "  Pazar 04:30 — intel_ban_db_prune (stale>=${INTEL_BAN_STALE_LAPTOP_PRUNE:-10} laptop / >=${INTEL_BAN_STALE_WARN_ROWS:-500}) -> $LOG_PRUNE"
echo "  Pazartesi 06:00 — operator_security_weekly -> $LOG_SECURITY"
echo "  Ayin 1'i 05:00 — POST_INSTALL_STRICT verify (internet-facing) -> $LOG_STRICT"
echo "  Manuel strict: POST_INSTALL_STRICT=1 bash scripts/post_install_verify.sh"
echo "  Kaldir: bash scripts/install_operator_cron.sh --remove"
echo "  Manuel: SKIP_DASHBOARD_REFRESH=1 bash scripts/morning_operator_chain.sh"
echo "          bash scripts/core_proof_refresh.sh"
