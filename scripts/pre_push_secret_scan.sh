#!/usr/bin/env bash
# GitHub push oncesi secret tarama — staged + tracked degisiklikler
#   bash scripts/pre_push_secret_scan.sh
#   bash scripts/pre_push_secret_scan.sh --staged-only
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAGED_ONLY=0
[[ "${1:-}" == "--staged-only" ]] && STAGED_ONLY=1

fail=0
warn=0

bad()  { echo "[FAIL] $*"; fail=$((fail + 1)); }
warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
ok()   { echo "[OK] $*"; }

echo "=== pre_push_secret_scan ==="
echo ""

# --- .env dosyalari staged mi? ---
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  bad "staged secret dosyasi: $f"
done < <(git diff --cached --name-only 2>/dev/null \
  | grep -E '\.env|webhook\.env$' | grep -vE '\.example$' || true)

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if git check-ignore -q "$f" 2>/dev/null; then
    ok "ignore: $f"
  else
    warn "untracked env benzeri (commit etme): $f"
  fi
done < <(git ls-files --others --exclude-standard 2>/dev/null \
  | grep -E '\.env|webhook\.env' | grep -vE '\.example$' || true)

# --- Taranacak dosyalar ---
mapfile -t FILES < <(
  if [[ "$STAGED_ONLY" -eq 1 ]]; then
    git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true
  else
    {
      git diff --name-only --diff-filter=ACMR 2>/dev/null || true
      git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true
      git ls-files --others --exclude-standard 2>/dev/null || true
    } | sort -u
  fi
)

if [[ ${#FILES[@]} -eq 0 ]]; then
  ok "taranacak dosya yok"
else
  echo "[scan] ${#FILES[@]} dosya"
fi

# Binary / buyuk / gereksiz atla
should_skip() {
  local f="$1"
  [[ -z "$f" || ! -f "$f" ]] && return 0
  case "$f" in
    *.o|*.deb|*.zip|*.pdf|*.db|*.sqlite|*.png|*.jpg|*.gif|*.ico|*.woff*|*.pyc) return 0 ;;
    data-room/*|graphify-out/*|.cache/*|assets/website-deploy/*|dist/deb-stage/*) return 0 ;;
    docs/website-lighthouse.json) return 0 ;;  # base64 JPEG icinde AKIA false positive
  esac
  return 1
}

SCAN_TMP="$(mktemp)"
trap 'rm -f "$SCAN_TMP"' EXIT

for f in "${FILES[@]}"; do
  should_skip "$f" && continue
  file -b "$f" 2>/dev/null | grep -qi text || continue
  cat "$f" >>"$SCAN_TMP" 2>/dev/null || true
done

# Telegram bot token: 123456789:AA...
if grep -qE '[0-9]{8,10}:[A-Za-z0-9_-]{30,}' "$SCAN_TMP" 2>/dev/null; then
  if grep -E '[0-9]{8,10}:[A-Za-z0-9_-]{30,}' "$SCAN_TMP" | grep -qvE '000000000:FAKE|123456789:ABC|FAKE:TOKEN|dev:token'; then
    bad "Telegram/API token benzeri pattern (FAKE/dis haric)"
    grep -nE '[0-9]{8,10}:[A-Za-z0-9_-]{30,}' "$SCAN_TMP" | grep -vE '000000000:FAKE|123456789:ABC|FAKE:TOKEN|dev:token' | head -3 || true
  else
    ok "token pattern yalnizca ornek/FAKE"
  fi
else
  ok "telegram token pattern yok"
fi

# AWS / GitHub / generic keys
for pat_label in \
  'AWS:AKIA[0-9A-Z]{16}' \
  'GitHub:ghp_[a-zA-Z0-9]{20,}' \
  'PrivateKey:BEGIN (RSA |EC )?PRIVATE KEY'; do
  label="${pat_label%%:*}"
  pat="${pat_label#*:}"
  if grep -qE "$pat" "$SCAN_TMP" 2>/dev/null; then
    bad "$label key pattern"
  else
    ok "$label pattern yok"
  fi
done

# .env webhook local tracked degil
if git ls-files --error-unmatch .env.webhook.local >/dev/null 2>&1; then
  bad ".env.webhook.local tracked — git rm --cached gerekli"
else
  ok ".env.webhook.local tracked degil"
fi

echo ""
echo "=== ozet ==="
echo "  FAIL: $fail   WARN: $warn"
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] pre_push_secret_scan — push icin secret temiz"
  [[ "$warn" -gt 0 ]] && echo "  (WARN: .env dosyalarini commit etmeyin)"
  exit 0
fi
echo "[FAIL] pre_push_secret_scan — $fail madde" >&2
exit 1
