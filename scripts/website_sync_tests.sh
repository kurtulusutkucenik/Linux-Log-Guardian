#!/usr/bin/env bash
# competitive-proof -> site test kartlari + evidence (28 test)
#   bash scripts/website_sync_tests.sh
#   bash scripts/website_sync_tests.sh --deploy   # + pack + wrangler hazir
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DEPLOY=0
[[ "${1:-}" == "--deploy" ]] && DEPLOY=1

python3 "$ROOT/scripts/competitive_proof_build.py" -o "$ROOT/competitive-proof.json"
python3 "$ROOT/scripts/website_embed_tests.py"
bash "$ROOT/scripts/sync_evidence_pack.sh"
python3 "$ROOT/scripts/website_i18n_gen_locales.py"
python3 "$ROOT/scripts/website_bundle_i18n.py"
bash "$ROOT/scripts/website_refresh_sri.sh"

n="$(python3 -c "import json; print(len(json.load(open('competitive-proof.json'))['validationTests']))")"
echo "[OK] website_sync_tests — $n test gomuldu (assets/website + evidence)"

if [[ "$DEPLOY" -eq 1 ]]; then
  bash "$ROOT/scripts/website_pack_deploy.sh"
  bash "$ROOT/scripts/website_audit_deploy.sh"
  echo "[OK] website-deploy paketi hazir —: bash scripts/website_audit_deploy.sh && wrangler pages deploy"
fi
