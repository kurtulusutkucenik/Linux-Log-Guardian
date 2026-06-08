#!/usr/bin/env bash
# /etc/log-guardian/rules.conf icine JA3_CLUSTER anahtarlarini ekler (yoksa)
#   sudo bash scripts/merge_ja3_cluster_rules.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/merge_ja3_cluster_rules.sh" >&2
  exit 1
fi

if [[ ! -f "$CONF" ]]; then
  install -d /etc/log-guardian
  install -m 600 "$ROOT/rules.conf" "$CONF"
  echo "[OK] rules.conf kuruldu: $CONF"
fi

changed=0
grep -q '^JA3_CLUSTER_BAN=' "$CONF" || { echo "JA3_CLUSTER_BAN=1" >> "$CONF"; changed=1; }
grep -q '^JA3_CLUSTER_MIN_IPS=' "$CONF" || { echo "JA3_CLUSTER_MIN_IPS=3" >> "$CONF"; changed=1; }

if [[ "$changed" -eq 1 ]]; then
  echo "[OK] JA3_CLUSTER anahtarlari eklendi — systemctl restart log-guardian log-guardian-daemon"
else
  echo "[OK] JA3_CLUSTER zaten tanimli"
fi
