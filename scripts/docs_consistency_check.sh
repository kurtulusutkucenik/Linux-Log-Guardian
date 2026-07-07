#!/usr/bin/env bash
# Dokumantasyon / yonlendirme tutarliligi — guvenlik denetiminden AYRI
#   bash scripts/docs_consistency_check.sh
# Canli guvenlik: bash scripts/local_security_audit.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0

bad() { echo "[docs_check] FAIL: $*" >&2; fail=$((fail + 1)); }
ok()  { echo "[OK] $*"; }

echo "=== docs_consistency_check ==="

[[ -f docs/LAPTOP_OPS.md ]] && ok "docs/LAPTOP_OPS.md" || bad "docs/LAPTOP_OPS.md yok"

if grep -qE '^API_BIND=0\.0\.0\.0' rules.conf 2>/dev/null; then
  bad "rules.conf sablonu API_BIND=0.0.0.0"
else
  ok "rules.conf API_BIND sablonu"
fi

if grep -rq 'admin123' --include='*.md' --include='*.sh' docs README.md SECURITY.md 2>/dev/null \
   || grep -rq 'admin123' scripts --exclude='docs_consistency_check.sh' 2>/dev/null; then
  bad "admin123 referansi kaldi (docs/scripts)"
else
  ok "admin123 yok"
fi

for f in scripts/ensure_api_security.sh scripts/laptop_jwt_setup.sh scripts/install_fp_trust_prod.sh scripts/laptop_soak_72h.sh \
        scripts/install_first_run.sh scripts/api_fail_closed_test.sh scripts/install_audit_cron.sh \
        scripts/rotate_api_token.sh scripts/install_fp_report_cron.sh scripts/publish_soak_report.sh \
        scripts/ipv6_ban_e2e.sh         scripts/post_install_verify.sh scripts/detect_internet_facing.sh \
        scripts/soak_active_lock.sh scripts/fix_ipc_perms.sh scripts/zip_for_vm.sh \
        scripts/install_threat_feed_live.sh scripts/threat_feed_live_proof.sh \
        scripts/install_threat_intel_stack.sh scripts/threat_intel_status.sh; do
  [[ -x "$f" ]] && ok "$f" || bad "$f eksik veya calistirilamaz"
done

for f in docs/QUICKSTART_15MIN.md docs/ROADMAP_FREE.md docs/VPS_SETUP.md docs/SECURITY_PROFILES.md; do
  [[ -f "$f" ]] && ok "$f" || bad "$f yok"
done

if grep -q 'ensure_api_security' docs/QUICKSTART_NGINX.md docs/LAPTOP_OPS.md SECURITY.md; then
  ok "ensure_api_security dokumante"
else
  bad "ensure_api_security eksik (QUICKSTART/LAPTOP_OPS/SECURITY)"
fi

if grep -q 'laptop_soak_72h' docs/SOAK_TEST.md; then
  ok "laptop_soak_72h SOAK_TEST'te"
else
  bad "laptop_soak_72h SOAK_TEST'te yok"
fi

if grep -q 'edge_protection_checklist' docs/EDGE_PROTECTION.md docs/LAPTOP_OPS.md 2>/dev/null; then
  ok "edge_protection_checklist dokumante"
else
  bad "edge_protection_checklist eksik (EDGE_PROTECTION/LAPTOP_OPS)"
fi

[[ -x scripts/edge_protection_checklist.sh ]] && ok "edge_protection_checklist.sh" || bad "edge_protection_checklist.sh eksik"

if grep -q 'install_fp_trust_prod' docs/HOSTING_RUNBOOK_TR.md docs/LAPTOP_OPS.md; then
  ok "install_fp_trust_prod dokumante"
else
  bad "install_fp_trust_prod eksik"
fi

if grep -q 'enterprise_e9_verify' docs/ENTERPRISE_SUPPORT.md docs/LAPTOP_OPS.md 2>/dev/null; then
  ok "enterprise_e9_verify dokumante"
else
  bad "enterprise_e9_verify eksik (ENTERPRISE_SUPPORT/LAPTOP_OPS)"
fi

[[ -x scripts/enterprise_e9_verify.sh ]] && ok "enterprise_e9_verify.sh" || bad "enterprise_e9_verify.sh eksik"

# Sprint AK — 64+ test vitrin + HOSTING_RUNBOOK Telegram cross-link
if [[ -f competitive-proof.json ]]; then
  proof_n=$(python3 -c "import json; print(len(json.load(open('competitive-proof.json')).get('validationTests',[])))" 2>/dev/null || echo 0)
  if [[ "${proof_n:-0}" -ge 64 ]]; then
    ok "competitive-proof validationTests=${proof_n}"
  else
    bad "competitive-proof tests=${proof_n} (beklenen >=64)"
  fi
else
  bad "competitive-proof.json yok"
fi

if grep -rq '75 test' landing/lib landing/public/og.svg 2>/dev/null; then
  bad "landing bayat '75 test' — landing/lib/content.ts PROOF_TEST_COUNT ile hizala"
else
  ok "landing test sayisi (75 test yok)"
fi

if grep -qE '8b\. Telegram|§8b' docs/HOSTING_RUNBOOK_TR.md \
   && grep -q 'telegram_soc_gate' docs/HOSTING_RUNBOOK_TR.md \
   && grep -q 'ENTERPRISE_ESCALATION' docs/HOSTING_RUNBOOK_TR.md; then
  ok "HOSTING_RUNBOOK §8b Telegram"
else
  bad "HOSTING_RUNBOOK §8b Telegram eksik"
fi

if grep -q 'HOSTING_RUNBOOK_TR.md' docs/ENTERPRISE_ESCALATION.md \
   && grep -qE '§8b|8b' docs/ENTERPRISE_ESCALATION.md; then
  ok "ENTERPRISE_ESCALATION → hosting §8b"
else
  bad "ENTERPRISE_ESCALATION hosting §8b link eksik"
fi

for doc_pat in "${proof_n} kart:docs/ENTERPRISE_SUPPORT.md" "${proof_n}/${proof_n}:docs/COMPETITIVE_STATUS.md" "${proof_n} test:docs/SCOPE_COVERAGE.md"; do
  label="${doc_pat%%:*}"
  docf="${doc_pat#*:}"
  if grep -q "$label" "$docf" 2>/dev/null; then
    ok "$docf ($label)"
  else
    bad "$docf — $label yok"
  fi
done

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] docs_consistency_check — $fail fail"
  exit 0
fi
echo "[FAIL] docs_consistency_check — $fail madde" >&2
exit 1
