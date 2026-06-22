#!/usr/bin/env bash
# OpenAPI strict + inline consult profil kontrolu
#   bash scripts/openapi_strict_profile_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LIB="$ROOT/scripts/lib/rules_conf_read.sh"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$LIB"

CONF=$(lg_rules_conf_path)
fail=0
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== openapi_strict_profile_check ==="

strict="$(lg_rules_kv OPENAPI_STRICT 2>/dev/null || echo 0)"
if [[ "$strict" == "1" ]]; then
  ok "OPENAPI_STRICT=1"
else
  warn "OPENAPI_STRICT=0 — API host: sudo bash scripts/install_openapi_strict_prod.sh"
fi

if command -v nginx >/dev/null 2>&1; then
  if bash "$ROOT/scripts/check_nginx_inline_consult.sh" >/dev/null 2>&1; then
    ok "nginx inline consult snippet"
  else
    warn "inline consult eksik — sudo bash scripts/fix_nginx_inline_consult.sh"
  fi
else
  ok "nginx yok — inline consult atlandi"
fi

if bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  if [[ "$strict" == "1" ]]; then
    ok "internet-facing + OPENAPI_STRICT"
  else
    bad "internet-facing ama OPENAPI_STRICT=0 (BOLA yuzeyi)"
  fi
fi

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] openapi_strict_profile_check"
  exit 0
fi
echo "[FAIL] openapi_strict_profile_check — $fail" >&2
exit 1
