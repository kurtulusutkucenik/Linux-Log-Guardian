#!/usr/bin/env bash
# Gece sprint — guvenlik + istihbarat kapilari (laptop)
#   bash scripts/sprint_security_intel_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0
ok() { echo "  [OK] $*"; }
bad() { echo "  [FAIL] $*"; fail=$((fail + 1)); }

echo "=== sprint_security_intel_gate ==="

echo "--- build ---"
if make -j"$(nproc)" -q 2>/dev/null; then ok "make"; else
  make -j"$(nproc)" || { bad "make"; exit 1; }
  ok "make"
fi

echo "--- rules manifest ---"
bash scripts/rules_bundle_manifest.sh
[[ -f rules/crs-bundle.manifest.json ]] && ok "crs-bundle.manifest.json" || bad "manifest yok"

echo "--- rules verify (dry) ---"
RULES_VERIFY=1 LG_BIN="$ROOT/log-guardian" python3 - <<'PY' || bad "rules verify logic"
import json, hashlib, subprocess, sys
from pathlib import Path
root = Path(".")
rules = root / "rules/crs-bundle.rules"
manifest = json.loads((root / "rules/crs-bundle.manifest.json").read_text())
key = "rules/crs-bundle.rules"
expect = manifest["files"][key]
actual = hashlib.sha256(rules.read_bytes()).hexdigest()
if expect != actual:
    sys.exit(f"hash mismatch {expect} != {actual}")
print("[OK] manifest hash matches crs-bundle.rules")
PY

echo "--- ban policy rate cap (source) ---"
grep -q 'ban_policy_set_rate_cap' main.c && ok "BAN_MAX_AUTO_PER_MIN hook" || bad "rate cap hook"
grep -q 'chain_prev' ban_policy.c && ok "audit hash chain" || bad "audit chain"

echo "--- geoip offline ---"
grep -q 'geoip_lookup_load_offline_csv' geoip_lookup.c && ok "offline CSV loader" || bad "geoip offline"
grep -q 'geoip_lookup_load_mmdb' geoip_lookup.c && ok "MMDB loader" || bad "geoip MMDB"
[[ -f examples/geoip-offline-sample.csv ]] && ok "geoip sample CSV" || bad "geoip sample"
[[ -x scripts/geoip_mmdb_e2e.sh ]] && ok "geoip_mmdb_e2e.sh" || bad "geoip mmdb e2e script"
bash scripts/geoip_mmdb_e2e.sh && ok "geoip MMDB E2E" || bad "geoip MMDB E2E"

echo "--- SIEM STIX ---"
grep -q 'x_lg_tenant' siem_forwarder.c && ok "STIX export" || bad "STIX export"

echo "--- cloudflare real_ip ---"
[[ -f deploy/cloudflare-origin.conf ]] && ok "cloudflare-origin.conf" || bad "cloudflare conf"
[[ -x scripts/install_cloudflare_real_ip.sh ]] && ok "install_cloudflare_real_ip.sh" || bad "cf install script"

echo "--- crowdsec bouncer ---"
[[ -x scripts/crowdsec_bouncer_sync.sh ]] && ok "crowdsec_bouncer_sync.sh" || bad "crowdsec sync"
[[ -x scripts/crowdsec_bouncer_e2e.sh ]] && ok "crowdsec_bouncer_e2e.sh" || bad "crowdsec e2e"
[[ -f deploy/log-guardian-crowdsec-bouncer.timer ]] && ok "crowdsec systemd timer" || bad "crowdsec timer"
bash scripts/crowdsec_bouncer_e2e.sh && ok "crowdsec dry-run E2E" || bad "crowdsec E2E"

echo "--- TAXII / STIX pull ---"
[[ -x scripts/taxii_feed_sync.sh ]] && ok "taxii_feed_sync.sh" || bad "taxii sync"
[[ -f corpus/fixtures/taxii_stix_bundle.json ]] && ok "taxii STIX fixture" || bad "taxii fixture"
bash scripts/taxii_feed_e2e.sh && ok "taxii feed E2E" || bad "taxii E2E"

echo "--- webhook P2 (route + batch) ---"
[[ -x scripts/webhook_route_proof.sh ]] && ok "webhook_route_proof.sh" || bad "webhook route script"
bash scripts/webhook_route_proof.sh && ok "webhook P2 dry-run" || bad "webhook P2 E2E"

echo "--- website (landing parity) ---"
if bash scripts/website_preview_gate.sh >/dev/null 2>&1; then
  ok "website preview (landing test parity)"
else
  bad "website preview parity"
fi

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] sprint_security_intel_gate"
  exit 0
fi
echo "[FAIL] sprint_security_intel_gate — $fail madde" >&2
exit 1
