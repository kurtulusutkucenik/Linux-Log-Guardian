#!/usr/bin/env bash
# Aylik internet-facing sertlestirme kapisi (ban/WAF hattina dokunmaz)
#   POST_INSTALL_STRICT=1 bash scripts/post_install_verify.sh  (manuel)
#   bash scripts/operator_post_install_strict.sh               (cron)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== operator_post_install_strict ==="

if ! bash "$ROOT/scripts/detect_internet_facing.sh" 2>/dev/null; then
  echo "[SKIP] operator_post_install_strict — laptop profil (internet-facing degil)"
  exit 0
fi

if POST_INSTALL_STRICT=1 bash "$ROOT/scripts/post_install_verify.sh"; then
  note_strict=0
  if SKIP_MORNING=1 bash "$ROOT/scripts/enterprise_e9_verify.sh" >/dev/null 2>&1; then
    echo "[OK] enterprise_e9_verify (strict zincir)"
  else
    echo "[WARN] enterprise_e9_verify FAIL — docs/ENTERPRISE_SUPPORT.md" >&2
    note_strict=1
  fi
  if bash "$ROOT/scripts/edge_protection_checklist.sh" >/dev/null 2>&1; then
    ec=$(python3 -c "import json; s=json.load(open('$ROOT/edge-protection-checklist-report.json')).get('summary',{}); print(f\"{s.get('pass',0)}/{s.get('total',0)}\")" 2>/dev/null || echo "?")
    echo "[OK] edge_protection_checklist ($ec)"
  else
    echo "[WARN] edge_protection_checklist FAIL" >&2
    note_strict=1
  fi
  if [[ "$note_strict" -eq 0 ]]; then
    echo "[OK] operator_post_install_strict"
    exit 0
  fi
  msg="Log Guardian: POST_INSTALL_STRICT OK ama E9/edge checklist FAIL — bash scripts/enterprise_e9_verify.sh"
  echo "[WARN] $msg" >&2
  if [[ "${TELEGRAM_NOTIFY:-1}" == "1" ]]; then
    bash "$ROOT/scripts/operator_telegram_notify.sh" "$msg" 2>/dev/null || true
  fi
  exit 1
fi

msg="Log Guardian: POST_INSTALL_STRICT verify FAIL — bash scripts/post_install_verify.sh"
echo "[WARN] $msg" >&2
if [[ "${TELEGRAM_NOTIFY:-1}" == "1" ]]; then
  bash "$ROOT/scripts/operator_telegram_notify.sh" "$msg" 2>/dev/null || true
fi
exit 1
