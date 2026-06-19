#!/usr/bin/env bash
# Threat intel tam kurulum — Firehol (key YOK) + opsiyonel AbuseIPDB/OTX
#   sudo bash scripts/install_threat_intel_stack.sh
# API key ile:
#   sudo env ABUSEIPDB_API_KEY='...' bash scripts/install_threat_intel_stack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ "$(id -u)" -eq 0 ]] || { echo "[threat_intel_stack] sudo gerekli" >&2; exit 1; }

ENV_FILE="/etc/log-guardian/threat-feed.env"
install -d -m 750 /etc/log-guardian /etc/log-guardian/data

if [[ ! -f "$ENV_FILE" ]]; then
  install -m 600 "$ROOT/examples/threat-feed.env.example" "$ENV_FILE"
  echo "[OK] sablon: $ENV_FILE"
fi

# CLI override
for pair in "ABUSEIPDB_API_KEY:${ABUSEIPDB_API_KEY:-}" "OTX_API_KEY:${OTX_API_KEY:-}" \
            "THREAT_FEED_API_KEY:${THREAT_FEED_API_KEY:-}"; do
  key="${pair%%:*}"
  val="${pair#*:}"
  [[ -z "$val" ]] && continue
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >>"$ENV_FILE"
  fi
done
chmod 600 "$ENV_FILE"

echo ""
echo "=== [1/2] Firehol (API key gerektirmez) ==="
SKIP_API_FEED_INSTALL=1 bash "$ROOT/scripts/enable_threat_intel_prod.sh"

has_api=0
grep -qE '^(ABUSEIPDB_API_KEY|THREAT_FEED_API_KEY)=.+' "$ENV_FILE" 2>/dev/null && has_api=1
grep -qE '^OTX_API_KEY=.+' "$ENV_FILE" 2>/dev/null && has_api=1

echo ""
if [[ "$has_api" -eq 1 ]]; then
  echo "=== [2/2] AbuseIPDB/OTX API feed ==="
  bash "$ROOT/scripts/install_threat_feed_live.sh" --api-only
else
  echo "=== [2/2] API feed atlandi (anahtar yok) ==="
  echo "[INFO] Firehol-only mod — laptop icin yeterli"
  echo "  API key sonra: sudo nano $ENV_FILE"
  echo "               sudo bash scripts/install_threat_feed_live.sh"
fi

echo ""
bash "$ROOT/scripts/threat_intel_status.sh"
