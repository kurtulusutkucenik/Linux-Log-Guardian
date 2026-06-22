#!/usr/bin/env bash
# GitHub push oncesi — secret + build smoke (commit/push yapmaz)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
FAIL=0

bad() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
ok() { echo "  [OK] $*"; }

echo "=== github_push_gate ==="

if bash "$ROOT/scripts/pre_push_secret_scan.sh"; then
  ok "pre_push_secret_scan"
else
  bad "pre_push_secret_scan"
fi

if make -j"$(nproc)" log-guardian 2>/dev/null; then
  ok "make log-guardian"
else
  bad "make log-guardian"
fi

if [[ -x "$ROOT/log-guardian" ]] && "$ROOT/log-guardian" --health >/dev/null 2>&1; then
  ok "log-guardian --health"
elif [[ -x /usr/local/bin/log-guardian ]] && /usr/local/bin/log-guardian --health >/dev/null 2>&1; then
  ok "installed log-guardian --health"
else
  bad "health check"
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git status --porcelain | grep -qE '^[^?]'; then
    ok "working tree (degisiklik var — commit sonra push)"
    git status -sb | head -5 | sed 's/^/    /'
  else
    ok "working tree temiz"
  fi
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "[OK] github_push_gate — push icin teknik hazir"
  echo "  git add ... && git commit && git push"
  exit 0
fi
echo "[FAIL] github_push_gate ($FAIL)" >&2
exit 1
