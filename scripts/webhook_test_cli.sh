#!/usr/bin/env bash
# Manuel webhook-test — rules.conf WEBHOOK_ENABLED=0 olsa bile calisir (dry-run varsayilan)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG="${LG:-./log-guardian}"
[[ -x "$LG" ]] || LG=/usr/local/bin/log-guardian

KIND="${1:-alert}"
shift || true

export WEBHOOK_ENABLED=1
export WEBHOOK_DRY_RUN="${WEBHOOK_DRY_RUN:-1}"
export LOGANALYZER_TELEGRAM_TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-000000000:FAKE}"
export LOGANALYZER_TELEGRAM_CHAT_ID="${LOGANALYZER_TELEGRAM_CHAT_ID:--1001234567890}"

if [[ "$KIND" == "batch" ]]; then
  export WEBHOOK_TELEGRAM_BATCH_SEC="${WEBHOOK_TELEGRAM_BATCH_SEC:-10}"
  export WEBHOOK_TELEGRAM_ROUTE="${WEBHOOK_TELEGRAM_ROUTE:-1}"
  export LOGANALYZER_TELEGRAM_CHAT_WARN="${LOGANALYZER_TELEGRAM_CHAT_WARN:--1002222222222}"
  export LOGANALYZER_TELEGRAM_CHAT_CRIT="${LOGANALYZER_TELEGRAM_CHAT_CRIT:--1001111111111}"
fi

exec "$LG" webhook-test "$KIND" "$@"
