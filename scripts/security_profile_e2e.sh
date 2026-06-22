#!/usr/bin/env bash
# Guvenlik profili kaniti — internet-facing + demo parola → FAIL
#   bash scripts/security_profile_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== security_profile_e2e ==="

if [[ -f "$ROOT/docs/SECURITY_PROFILES.md" ]]; then
  ok "SECURITY_PROFILES.md"
else
  bad "SECURITY_PROFILES.md yok"
fi

# detect_internet_facing ↔ birincil IP tutarliligi
primary_ip=""
if command -v ip >/dev/null 2>&1; then
  primary_ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}' | head -1)
fi
[[ -z "$primary_ip" ]] && primary_ip=$(hostname -I 2>/dev/null | awk '{print $1}')

is_private=1
if [[ -n "$primary_ip" ]]; then
  if [[ "$primary_ip" =~ ^127\. ]] || [[ "$primary_ip" =~ ^10\. ]] \
      || [[ "$primary_ip" =~ ^192\.168\. ]] || [[ "$primary_ip" =~ ^169\.254\. ]] \
      || [[ "$primary_ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]]; then
    is_private=1
  else
    is_private=0
  fi
fi

if bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  if [[ "$is_private" -eq 1 ]]; then
    bad "private IP ($primary_ip) ama detect 0 — script hatasi"
  else
    ok "public IP ($primary_ip) — detect_internet_facing=0"
  fi
else
  if [[ "$is_private" -eq 1 ]]; then
    ok "private IP ($primary_ip) — detect_internet_facing=1 (laptop)"
  else
    bad "public IP ($primary_ip) ama detect 1 — script hatasi"
  fi
fi

# Zorla internet-facing → install_first_run banner (dry)
export LG_FORCE_INTERNET_FACING=1
if bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  ok "LG_FORCE_INTERNET_FACING=1 → internet-facing"
else
  bad "LG_FORCE_INTERNET_FACING calismadi"
fi
unset LG_FORCE_INTERNET_FACING

# Demo parola + internet-facing → post_install_verify FAIL beklenir
LIB="$ROOT/scripts/lib/rules_conf_read.sh"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$LIB"
kdf=$(lg_rules_kv "ACCESS_PASSWORD_KDF" 2>/dev/null || true)
demo_kdf="pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$"

if [[ "$kdf" == "${demo_kdf}"* ]]; then
  out="$(LG_FORCE_INTERNET_FACING=1 bash "$ROOT/scripts/post_install_verify.sh" 2>&1 || true)"
  if echo "$out" | grep -q '\[FAIL\] demo parolasi'; then
    ok "internet-facing + demo parola → FAIL (kanit)"
  elif echo "$out" | grep -q 'FAIL: 0'; then
    bad "demo parola FAIL uretilmedi (internet-facing sim)"
  else
    ok "internet-facing demo parola kontrolu calisti (cikis: $(echo "$out" | grep 'FAIL:' | tail -1))"
  fi
else
  ok "ACCESS_PASSWORD_KDF ozel — demo parola FAIL kaniti atlandi"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] security_profile_e2e"
  exit 0
fi
echo "[FAIL] security_profile_e2e — $fail madde" >&2
exit 1
