#!/usr/bin/env bash
# Operator parola/token yedegi — laptop_harden veya ensure_api_security sonrasi
#   bash scripts/backup_operator_secrets.sh
#   DEST=~/Belgeler/lg-secrets.txt bash scripts/backup_operator_secrets.sh
set -euo pipefail

DEST="${DEST:-$HOME/.config/log-guardian/operator-secrets.txt}"
mkdir -p "$(dirname "$DEST")"
umask 077

{
  echo "# Log Guardian operator secrets — $(date -Iseconds)"
  echo "# Bu dosyayi guvenli tutun (chmod 600). Chat'e yapistirmayin."
  echo ""
  if [[ -r /etc/log-guardian/rules.conf ]]; then
    echo "## /etc/log-guardian/rules.conf"
    grep -E '^(ACCESS_PASSWORD_KDF|API_TOKEN|API_BIND)=' /etc/log-guardian/rules.conf 2>/dev/null || true
    echo ""
  fi
  if [[ -r /etc/log-guardian/env ]]; then
    echo "## /etc/log-guardian/env"
    grep -E '^(LOGANALYZER_PASSWORD|GUARDIAN_API_TOKEN)=' /etc/log-guardian/env 2>/dev/null || true
    echo ""
  fi
  if [[ -r /etc/log-guardian/webhook.env ]]; then
    echo "## /etc/log-guardian/webhook.env"
    grep -E '^(LOGANALYZER_TELEGRAM|TELEGRAM_|WEBHOOK_)' /etc/log-guardian/webhook.env 2>/dev/null || true
    echo ""
  fi
  DASH="$HOME/Masaüstü/Linux Log Guardian/dashboard/.env"
  [[ -f "$DASH" ]] || DASH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../dashboard" 2>/dev/null && pwd)/.env"
  if [[ -f "$DASH" ]]; then
    echo "## dashboard/.env"
    grep -E '^(JWT_SECRET|DASHBOARD_FLEET_API_KEY|GUARDIAN_API_TOKEN)=' "$DASH" 2>/dev/null || true
    echo ""
  fi
} >"$DEST"
chmod 600 "$DEST"
echo "[OK] yedek: $DEST ($(wc -l <"$DEST") satir)"
echo "  Not: parolalari password manager'a da kopyalayin."
