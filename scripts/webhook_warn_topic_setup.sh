#!/usr/bin/env bash
# Ops forum #uyari topic + WARN mirror env satirlarini guvenli ekler
set -euo pipefail

ENV_FILE="${WEBHOOK_ENV:-/etc/log-guardian/webhook.env}"
TOPIC_WARN="${1:-17}"

[[ "${EUID:-$(id -u)}" -ne 0 ]] && exec sudo "$0" "$@"

set_kv() {
    local key="$1" val="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
        printf '\n%s=%s\n' "$key" "$val" >> "$ENV_FILE"
    fi
}

[[ -f "$ENV_FILE" ]] || touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

set_kv "WEBHOOK_TELEGRAM_TOPIC_WARN" "$TOPIC_WARN"
set_kv "WEBHOOK_TELEGRAM_MIRROR_WARN" "1"

echo "[warn_topic] $ENV_FILE guncellendi:"
grep -E '^WEBHOOK_TELEGRAM_TOPIC_WARN=|^WEBHOOK_TELEGRAM_MIRROR_WARN=' "$ENV_FILE"
echo "[warn_topic] systemctl restart log-guardian"
