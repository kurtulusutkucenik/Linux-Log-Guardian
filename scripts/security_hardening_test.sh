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
test -f docker-compose.prod.yml || fail "docker-compose.prod.yml yok"
grep -q 'User=log-guardian' install.sh || fail "log-guardian user yok"
grep -q 'Type=simple' install.sh || fail "analyzer Type=simple yok"

# rules.conf — statik fleet test token olmamali
if grep -q 'sk_guardian_fleet_test_token_123' rules.conf; then
  fail "rules.conf hala test fleet token iceriyor"
fi

make -s log-guardian log-guardian-daemon 2>/dev/null || make -s log-guardian log-guardian-daemon

python3 - <<'PY'
import json, subprocess, os
os.environ.setdefault("LOGANALYZER_PASSWORD", "DegistirBeni!123")
out = subprocess.check_output(["./log-guardian", "--status"], text=True)
d = json.loads(out)
assert "l7_http" in d
print("[OK] --status JSON")
PY

echo "[OK] security_hardening"
