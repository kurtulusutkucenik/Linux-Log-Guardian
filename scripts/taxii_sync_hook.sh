#!/usr/bin/env bash
# Opsiyonel TAXII sync — yalnizca rules.conf'ta gecerli TAXII_URL varsa calisir.
#   sudo bash scripts/taxii_sync_hook.sh
# Threat intel timer: log-guardian-taxii-sync (enable_threat_intel_prod.sh kurar)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# systemd: /usr/local/bin/log-guardian-taxii-sync -> repo scripts/
[[ -f "$ROOT/scripts/taxii_feed_sync.sh" ]] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# shellcheck source=lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

url="$(lg_rules_kv TAXII_URL)"
key="$(lg_rules_kv TAXII_API_KEY)"
min_conf="$(lg_rules_kv TAXII_MIN_CONFIDENCE)"

if [[ -z "$url" ]]; then
  echo "[SKIP] taxii_sync_hook — TAXII_URL yok (rules.conf); fixture test: bash scripts/taxii_feed_e2e.sh"
  exit 0
fi

export TAXII_URL="$url"
[[ -n "$key" ]] && export TAXII_API_KEY="$key"
[[ -n "$min_conf" ]] && export TAXII_MIN_CONFIDENCE="$min_conf"
export TAXII_DRY_RUN=0
export LG_RULES="$(lg_rules_conf_path)"

echo "=== taxii_sync_hook ==="
bash "$ROOT/scripts/taxii_feed_sync.sh"
echo "[OK] taxii_sync_hook"
