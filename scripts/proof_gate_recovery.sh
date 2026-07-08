#!/usr/bin/env bash
# competitive-proof meta-gate toparlama — full_proof_pack / IPv6 gerektirmez (~2-4 dk)
#   bash scripts/proof_gate_recovery.sh
#   REFRESH=1 bash scripts/proof_gate_recovery.sh   # laptop_core + morning gate yenile
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"
export SKIP_LIVE="${SKIP_LIVE:-1}"
export SKIP_FLEET="${SKIP_FLEET:-1}"
export SKIP_IPV6="${SKIP_IPV6:-1}"

fail_step() {
  echo "[proof_gate_recovery] FAIL: $*" >&2
  exit 1
}

proof_counts() {
  python3 -c "
import json
from pathlib import Path
p = Path('competitive-proof.json')
if not p.is_file():
    print('?/?')
    raise SystemExit(0)
t = json.loads(p.read_text(encoding='utf-8')).get('validationTests') or []
pn = sum(1 for x in t if x.get('status') == 'pass')
print(f'{pn}/{len(t)}')
" 2>/dev/null || echo "?/?"
}

proof_all_pass() {
  python3 -c "
import json, sys
from pathlib import Path
p = Path('competitive-proof.json')
if not p.is_file():
    sys.exit(1)
t = json.loads(p.read_text(encoding='utf-8')).get('validationTests') or []
if not t:
    sys.exit(1)
fail = sum(1 for x in t if x.get('status') not in ('pass', 'warn'))
sys.exit(0 if fail == 0 and all(x.get('status') in ('pass', 'warn') for x in t) else 1)
" 2>/dev/null
}

echo "=== proof_gate_recovery (full_proof_pack yok, SKIP_IPV6=1) ==="

if [[ -f /etc/log-guardian/webhook.env ]] && ! [[ -r /etc/log-guardian/webhook.env ]] \
    && command -v sudo >/dev/null 2>&1; then
  sudo bash "$ROOT/scripts/guardian_status_export.sh" \
    || bash "$ROOT/scripts/guardian_status_export.sh"
else
  bash "$ROOT/scripts/guardian_status_export.sh"
fi

bash "$ROOT/scripts/ops_gate_report.sh"

# Login 429 bucket sifirla (dashboard in-memory rate limit)
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-dashboard; then
  docker compose -f docker-compose.prod.yml restart dashboard >/dev/null 2>&1 \
    && sleep 4 \
    && echo "[OK] dashboard restart (login rate-limit sifir)" \
    || echo "[WARN] dashboard restart atlandi" >&2
fi

bash "$ROOT/scripts/bans_telegram_ops_e2e.sh" >/dev/null 2>&1 \
  && echo "[OK] bans_telegram_ops" \
  || echo "[WARN] bans_telegram_ops — login 429? dashboard restart veya 15dk bekle" >&2

bash "$ROOT/scripts/api_mutation_token_e2e.sh" >/dev/null 2>&1 \
  && echo "[OK] api_mutation_token_e2e" \
  || echo "[WARN] api_mutation_token_e2e — sudo bash scripts/ensure_api_split_tokens.sh" >&2

bash "$ROOT/scripts/ban_api_mtls_e2e.sh" >/dev/null 2>&1 \
  && echo "[OK] ban_api_mtls_e2e" \
  || echo "[WARN] ban_api_mtls_e2e — bash scripts/mtls_client_issue.sh" >&2

bash "$ROOT/scripts/enterprise_soar_gate.sh" >/dev/null 2>&1 \
  && echo "[OK] enterprise_soar_gate" \
  || echo "[WARN] enterprise_soar_gate — sudo bash scripts/enable_enterprise_soar_api.sh" >&2

bash "$ROOT/scripts/mtls_cert_expiry_check.sh" >/dev/null 2>&1 \
  && echo "[OK] mtls_cert_expiry_check" \
  || echo "[WARN] mtls_cert_expiry_check — bash scripts/mtls_cert_expiry_check.sh" >&2

bash "$ROOT/scripts/dashboard_login_rate_limit_e2e.sh" >/dev/null 2>&1 \
  && echo "[OK] dashboard_login_rate_limit_e2e" \
  || echo "[WARN] dashboard_login_rate_limit_e2e — dashboard :3000 ayakta mi?" >&2

bash "$ROOT/scripts/hardening_rollback_gate.sh" >/dev/null 2>&1 \
  && echo "[OK] hardening_rollback_gate" \
  || echo "[WARN] hardening_rollback_gate" >&2

bash "$ROOT/scripts/dashboard_security_gates.sh" >/dev/null 2>&1 \
  && echo "[OK] dashboard_security_gates" \
  || echo "[WARN] dashboard_security_gates — hardening/jwt/mtls/login RL" >&2

bash "$ROOT/scripts/dashboard_tests_parity_check.sh" \
  && echo "[OK] dashboard_tests_parity" \
  || fail_step "dashboard_tests_parity — competitive_proof_build + validationTests.ts"

bash "$ROOT/scripts/sync_dashboard_api_token.sh" >/dev/null 2>&1 \
  && bash "$ROOT/scripts/dashboard_ban_smoke.sh" >/dev/null 2>&1 \
  && echo "[OK] dashboard_ban_smoke" \
  || echo "[WARN] dashboard_ban_smoke — ban-api-relay docker internal veya token" >&2

if bash "$ROOT/scripts/nginx_inline_consult_proof.sh" >/dev/null 2>&1; then
  echo "[OK] nginx_inline_consult"
else
  echo "[WARN] nginx_inline_consult — sudo systemctl restart log-guardian" >&2
fi

python3 "$ROOT/scripts/competitive_proof_build.py" || fail_step "competitive_proof_build"
echo "[OK] competitive_proof_build ($(proof_counts))"

python3 "$ROOT/scripts/sync_landing_tests_from_proof.py"
bash "$ROOT/scripts/website_preview_gate.sh" || fail_step "website_preview_gate"
python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null

SKIP_FLEET=1 SKIP_LIVE=1 bash "$ROOT/scripts/release_ready_gate.sh" \
  || fail_step "release_ready_gate"
echo "[OK] release_ready_gate"

SKIP_FLEET=1 SKIP_LIVE=1 bash "$ROOT/scripts/presentation_ship_gate.sh" \
  || fail_step "presentation_ship_gate"
echo "[OK] presentation_ship_gate"

SKIP_SIEM_E2E=1 bash "$ROOT/scripts/github_ship_gate.sh" \
  || fail_step "github_ship_gate (security_closure dahil)"
echo "[OK] github_ship_gate"

SKIP_EDGE=1 bash "$ROOT/scripts/laptop_core_gate.sh" \
  || fail_step "laptop_core_gate"
echo "[OK] laptop_core_gate"

python3 "$ROOT/scripts/competitive_proof_build.py"
python3 "$ROOT/scripts/sync_landing_tests_from_proof.py"
bash "$ROOT/scripts/website_preview_gate.sh"
bash "$ROOT/scripts/proof_meta_gates_refresh.sh" || true
python3 "$ROOT/scripts/competitive_proof_build.py"

REFRESH="${REFRESH:-1}" bash "$ROOT/scripts/morning_operator_gate.sh" \
  || fail_step "morning_operator_gate"

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
bash "$ROOT/scripts/sync_evidence_pack.sh" 2>/dev/null || true

final="$(proof_counts)"
echo ""
echo "[OK] proof_gate_recovery tamam — validationTests $final"
if ! proof_all_pass; then
  echo "[WARN] competitive-proof tam pass degil — competitive-proof.json kontrol edin" >&2
  exit 1
fi
