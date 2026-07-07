#!/usr/bin/env bash
# Guvenlik + 7/24 sertlestirme dogrulama
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[security_hardening] FAIL: $*" >&2; exit 1; }

echo "=== security_hardening ==="

# IPC auth modulu
test -f ipc_auth.c || fail "ipc_auth.c yok"
grep -q 'ipc_auth_validate_message' ipc_auth.c || fail "ipc auth validate yok"
grep -q 'SO_PEERCRED' ebpf_daemon.c || fail "SO_PEERCRED kontrolu yok"
grep -q 'shutdown denied' ebpf_daemon.c || fail "IPC shutdown korumasi yok"
grep -q 'chown(DAEMON_IPC_SOCK_PATH' ebpf_daemon.c || fail "IPC socket chown yok"

# Analyzer 7/24
grep -q 'READY=1' main.c || fail "sd_notify READY=1 yok"
grep -q 'Log sonundan baslaniyor' main.c || fail "--follow seek-to-end yok"
grep -q 'g_db_dropped' db.c || fail "DB queue overflow korumasi yok"

# Dashboard guvenlik
grep -q 'getJwtSecret' dashboard/src/lib/authSecrets.ts || fail "JWT secret helper yok"
grep -q 'scrypt:' dashboard/src/lib/password.ts || fail "scrypt password yok"
grep -q 'checkLoginRateLimit' dashboard/src/lib/loginRateLimit.ts || fail "login rate limit yok"
grep -q 'DASHBOARD_SEED' dashboard/prisma/seed.mjs || fail "seed prod guard yok"
grep -q 'output: "standalone"' dashboard/next.config.ts || fail "next standalone yok"

# K8s operator auth
grep -q 'K8S_OPERATOR_TOKEN' k8s-operator/main.go || fail "k8s operator token yok"

# install.sh prod
grep -q 'create_production_env' install.sh || fail "install env uretimi yok"
test -f deploy/Caddyfile || fail "deploy/Caddyfile yok"
test -f scripts/soak_test.sh || fail "soak_test.sh yok"
test -f scripts/firewall_api_bind.sh || fail "firewall_api_bind.sh yok"
grep -q 'lg_firewall_api_bind_install' scripts/firewall_api_bind.sh || fail "firewall api bind helper yok"
test -f scripts/firewall_dashboard_bind.sh || fail "firewall_dashboard_bind.sh yok"
grep -q 'lg_firewall_dashboard_bind_install' scripts/firewall_dashboard_bind.sh || fail "firewall dashboard bind helper yok"
grep -q 'firewall_api_bind.sh' scripts/laptop_harden.sh || fail "laptop_harden firewall fallback yok"
grep -q 'fail-closed' api_server.c || fail "api fail-closed yok"
grep -q 'api_check_read_auth' api_server.c || fail "api read auth yok"
grep -q 'ban_rate_ok' api_server.c || fail "api ban rate limit yok"
grep -q 'consult_ip_rate_ok' api_server.c || fail "api consult per-ip limit yok"
grep -q 'consult_cache_store' api_server.c || fail "api consult cache yok"
grep -q 'apply_auto_ban_profile' main.c || fail "AUTO_BAN_PROFILE preset yok"
grep -q 'use_offline_list' threat_intel.sh || fail "threat intel offline fallback yok"
grep -q 'TRUST_XFF' parser.c || fail "parser TRUST_XFF yok"
grep -q 'URL scheme/host denied' threat_feed.c || fail "threat feed URL sandbox yok"
grep -q 'THREAT_FEED_STATS_JSON' threat_feed.c || fail "threat feed stats persist yok"
grep -q 'threat_last_applied' metrics.h || fail "threat feed applied metrik yok"
grep -q 'api_auth_fail_total' metrics.h || fail "api auth fail metrik yok"
grep -q 'wasm_plugin_path_allowed' wasm_runtime.c || fail "wasm plugin path guard yok"
grep -q 'consume_fuel_set' wasm_runtime.c || fail "wasm fuel limit yok"
if grep -q 'popen(' firewall.c ebpf_daemon.c telegram_bot.c 2>/dev/null; then
  fail "popen kaldi (firewall/daemon/telegram)"
fi
test -x scripts/ensure_ipv6_ipset.sh || fail "ensure_ipv6_ipset.sh yok"
test -x scripts/ipv6_ban_e2e.sh || fail "ipv6_ban_e2e.sh yok"
test -f docker-compose.prod.yml || fail "docker-compose.prod.yml yok"
grep -q 'User=log-guardian' install.sh || fail "log-guardian user yok"
grep -q 'Type=simple' install.sh || fail "analyzer Type=simple yok"

# rules.conf — statik fleet test token olmamali
if grep -q 'sk_guardian_fleet_test_token_123' rules.conf; then
  fail "rules.conf hala test fleet token iceriyor"
fi

if [[ "${LG_SKIP_BUILD:-0}" == "1" ]]; then
  [[ -x ./log-guardian ]] || fail "log-guardian yok — make veya LG_SKIP_BUILD=0"
  echo "[OK] derleme atlandi (LG_SKIP_BUILD=1)"
  if [[ -x ./tests/parser_xff_test ]]; then
    ./tests/parser_xff_test || fail "parser_xff_test"
  else
    make -s xff-test 2>/dev/null || fail "parser_xff_test (tests/parser_xff_test yok)"
  fi
else
  make -s log-guardian log-guardian-daemon 2>/dev/null || make -s log-guardian log-guardian-daemon
  make -s xff-test 2>/dev/null || fail "parser_xff_test"
fi

python3 - <<'PY'
import json, subprocess, os
os.environ.setdefault("LOGANALYZER_PASSWORD", "DegistirBeni!123")
out = subprocess.check_output(["./log-guardian", "--status"], text=True)
d = json.loads(out)
assert "l7_http" in d
print("[OK] --status JSON")
PY

echo "[OK] security_hardening"
