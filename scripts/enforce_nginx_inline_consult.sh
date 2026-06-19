#!/usr/bin/env bash
# nginx inline consult — eksikse otomatik duzelt (prod default)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if bash "$ROOT/scripts/check_nginx_inline_consult.sh"; then
  echo "[enforce_nginx_inline_consult] OK — inline consult tam"
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[enforce_nginx_inline_consult] FAIL: root gerekli — sudo bash scripts/fix_nginx_inline_consult.sh" >&2
  exit 1
fi

echo "[enforce_nginx_inline_consult] eksik — otomatik duzeltme..." >&2
if bash "$ROOT/scripts/fix_nginx_inline_consult.sh"; then
  echo "[enforce_nginx_inline_consult] OK — otomatik kuruldu"
  exit 0
fi

echo "[enforce_nginx_inline_consult] FAIL: otomatik kurulum basarisiz" >&2
exit 1
