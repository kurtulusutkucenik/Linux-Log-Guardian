#!/usr/bin/env bash
# nginx inline consult — otomatik baglama (auth_request + API_PORT)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNIP_CONSULT="/etc/nginx/snippets/log-guardian-inline-consult.conf"
SNIP_SERVER="/etc/nginx/snippets/log-guardian-inline-server.conf"
MARKER="log-guardian-inline-consult"

echo "=== fix_nginx_inline_consult ==="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin:"
  echo "  sudo bash scripts/fix_nginx_inline_consult.sh"
  exit 1
fi

command -v nginx >/dev/null 2>&1 || { echo "nginx kurulu degil" >&2; exit 1; }

bash "$ROOT/scripts/merge_nginx_inline_consult.sh"

install -d /etc/nginx/snippets
install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-inline-consult.conf" "$SNIP_CONSULT"
install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-inline-server.conf" "$SNIP_SERVER"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
API_TOK=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
if [[ -n "$API_TOK" ]]; then
  bash "$ROOT/scripts/lib/sync_nginx_consult_token.sh" "$API_TOK"
  echo "[OK] consult snippet API token enjekte edildi"
else
  echo "[WARN] API_TOKEN yok — once: sudo bash scripts/ensure_api_security.sh" >&2
fi
echo "[OK] snippets -> /etc/nginx/snippets/"

python3 <<'PY'
import glob
import re
import shutil
from datetime import datetime
from pathlib import Path

MARKER = "log-guardian-inline-consult"
INCLUDE_CONSULT = "    include /etc/nginx/snippets/log-guardian-inline-consult.conf;  # " + MARKER
INCLUDE_SERVER = "    include /etc/nginx/snippets/log-guardian-inline-server.conf;  # " + MARKER
AUTH_LINE = "        auth_request /_lg_consult;  # " + MARKER

SKIP = {
    "/etc/nginx/snippets/log-guardian-inline-consult.conf",
    "/etc/nginx/snippets/log-guardian-inline-server.conf",
}

candidates: list[Path] = []
for pattern in (
    "/etc/nginx/sites-enabled/*",
    "/etc/nginx/sites-available/default",
    "/etc/nginx/conf.d/*.conf",
):
    for p in glob.glob(pattern):
        candidates.append(Path(p))

seen: set[str] = set()
for path in sorted(candidates):
    rp = str(path.resolve())
    if rp in seen or not path.is_file():
        continue
    seen.add(rp)
    if rp in SKIP:
        continue
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    if "listen" not in text or not re.search(r"listen\s+[^;]*\b80\b", text):
        continue

    new = text
    changed = False

    if MARKER not in new:
        m = re.search(r"server\s*\{", new)
        if not m:
            continue
        insert = INCLUDE_CONSULT + "\n" + INCLUDE_SERVER + "\n"
        new = new[: m.end()] + "\n" + insert + new[m.end() :]
        changed = True

    if "auth_request /_lg_consult" not in new:
        loc = re.search(r"location\s+/\s*\{", new)
        if loc:
            new = (
                new[: loc.end()]
                + "\n"
                + AUTH_LINE
                + new[loc.end() :]
            )
            changed = True

    if changed and new != text:
        bak = path.with_suffix(path.suffix + f".bak.{datetime.now():%Y%m%d}")
        shutil.copy2(path, bak)
        path.write_text(new, encoding="utf-8")
        print(f"[OK] inline consult -> {path} (yedek: {bak.name})")
    elif MARKER in text:
        print(f"[OK] zaten inline consult: {path}")
PY

if ! nginx -t 2>&1; then
  echo "[FAIL] nginx -t basarisiz — *.bak.* dosyasindan geri yukleyebilirsiniz" >&2
  exit 1
fi
systemctl reload nginx
echo "[OK] nginx reload"

systemctl restart log-guardian 2>/dev/null || true
sleep 2

if bash "$ROOT/scripts/check_nginx_inline_consult.sh"; then
  echo "[OK] fix_nginx_inline_consult tamam"
else
  exit 1
fi
