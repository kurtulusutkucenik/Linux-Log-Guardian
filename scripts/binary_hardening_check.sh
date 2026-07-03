#!/usr/bin/env bash
# Derlenmis binary'lerde PIE + tam RELRO dogrulama (Makefile hardening)
#   bash scripts/binary_hardening_check.sh
#   bash scripts/binary_hardening_check.sh /usr/local/bin/log-guardian
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
warn_n=0
ok()   { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; warn_n=$((warn_n + 1)); }
bad()  { echo "[FAIL] $*"; fail=$((fail + 1)); }
xfail() { if [[ "${1:-1}" -eq 1 ]]; then bad "$2"; else warn "$2"; fi; }

check_binary() {
  local bin="$1"
  local label="$2"
  local strict="${3:-1}"

  [[ -f "$bin" ]] || { xfail "$strict" "$label — dosya yok: $bin"; return; }
  [[ -x "$bin" ]] || xfail "$strict" "$label — calistirilabilir degil: $bin"

  if file "$bin" 2>/dev/null | grep -qiE 'pie executable|position-independent'; then
    ok "$label — PIE (file)"
  elif readelf -h "$bin" 2>/dev/null | grep -qE 'Type:[[:space:]]+DYN'; then
    ok "$label — PIE (readelf DYN)"
  else
    xfail "$strict" "$label — PIE yok"
  fi

  if readelf -l "$bin" 2>/dev/null | grep -q 'GNU_RELRO'; then
    ok "$label — GNU_RELRO"
  else
    xfail "$strict" "$label — GNU_RELRO yok"
  fi

  if readelf -d "$bin" 2>/dev/null | grep -q 'BIND_NOW'; then
    ok "$label — BIND_NOW (tam RELRO)"
  else
    xfail "$strict" "$label — BIND_NOW yok (tam RELRO degil)"
  fi
}

echo "=== binary_hardening_check ==="

if [[ "$#" -gt 0 ]]; then
  for bin in "$@"; do
    check_binary "$bin" "$(basename "$bin")"
  done
else
  [[ -x "$ROOT/log-guardian" ]] \
    && check_binary "$ROOT/log-guardian" "log-guardian (repo)" \
    || bad "log-guardian (repo) — make -j\$(nproc) gerekli"
  if [[ -x "$ROOT/log-guardian-daemon" ]]; then
    check_binary "$ROOT/log-guardian-daemon" "log-guardian-daemon (repo)"
  fi
  [[ -x /usr/local/bin/log-guardian ]] \
    && check_binary /usr/local/bin/log-guardian "log-guardian (kurulu)" 0 || true
  [[ -x /usr/local/bin/log-guardian-daemon ]] \
    && check_binary /usr/local/bin/log-guardian-daemon "log-guardian-daemon (kurulu)" 0 || true
fi

if [[ "$fail" -gt 0 ]]; then
  echo "[binary_hardening_check] FAIL: $fail kontrol" >&2
  exit 1
fi
if [[ "$warn_n" -gt 0 ]]; then
  echo "[OK] binary_hardening_check — repo binary OK; $warn_n kurulu uyari (sudo bash scripts/upgrade_log_guardian_binary.sh)"
else
  echo "[OK] binary_hardening_check — tum kontroller gecti"
fi
