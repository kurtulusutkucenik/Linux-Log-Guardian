#!/usr/bin/env bash
# nginx inline consult snippet(ler)ine API_TOKEN enjekte et
#   sync_nginx_consult_token.sh <token>
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOK="${1:-}"
[[ -n "$TOK" ]] || { echo "[sync_nginx_consult_token] token bos" >&2; exit 1; }

patch_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  if grep -qE '__LG_API_TOKEN__|X-Guardian-Token' "$f" 2>/dev/null; then
    sed -i "s|__LG_API_TOKEN__|${TOK}|g" "$f"
    sed -i "s|X-Guardian-Token \"[^\"]*\"|X-Guardian-Token \"${TOK}\"|g" "$f"
    echo "[OK] nginx consult token -> $f"
  fi
}

patch_file /etc/nginx/snippets/log-guardian-inline-consult.conf

if command -v nginx >/dev/null 2>&1; then
  python3 - "$TOK" <<'PY'
import re, subprocess, sys
tok = sys.argv[1]
try:
    out = subprocess.check_output(["nginx", "-T"], text=True, stderr=subprocess.STDOUT)
except (subprocess.CalledProcessError, FileNotFoundError):
    raise SystemExit(0)
seen = set()
for m in re.finditer(r"^# configuration file ([^\n]+log-guardian-inline-consult[^\n]*):", out, re.M):
    path = m.group(1).strip()
    if path in seen:
        continue
    seen.add(path)
    try:
        text = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        continue
    if "__LG_API_TOKEN__" not in text and "X-Guardian-Token" not in text:
        continue
    text = text.replace("__LG_API_TOKEN__", tok)
    text = re.sub(r'X-Guardian-Token "[^"]*"', f'X-Guardian-Token "{tok}"', text)
    open(path, "w", encoding="utf-8").write(text)
    print(f"[OK] nginx consult token -> {path}")
PY
fi

if [[ -f "$ROOT/examples/nginx/snippets/log-guardian-inline-consult.conf" ]]; then
  if grep -q '__LG_API_TOKEN__' "$ROOT/examples/nginx/snippets/log-guardian-inline-consult.conf" 2>/dev/null; then
    echo "[INFO] repo snippet hala __LG_API_TOKEN__ — nginx icin:" >&2
    echo "       sudo bash scripts/fix_nginx_inline_consult.sh" >&2
  fi
fi
