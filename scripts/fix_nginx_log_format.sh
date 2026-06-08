#!/usr/bin/env bash
# log_guardian format — otomatik nginx baglama (POST SQLi icin $request_body)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNIP_DST="/etc/nginx/snippets/log-guardian.conf"
SNIP_SERVER_DST="/etc/nginx/snippets/log-guardian-server.conf"
HTTP_INLINE="/etc/nginx/snippets/log-guardian-http-inline.conf"
NGINX_MAIN="/etc/nginx/nginx.conf"
HTTP_DROPIN_OLD="/etc/nginx/conf.d/00-log-guardian-http.conf"
INCLUDE_LINE='include /etc/nginx/snippets/log-guardian-http-inline.conf;'
MARKER="log-guardian-http-inline"

echo "=== fix_nginx_log_format ==="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin:"
  echo "  sudo bash scripts/fix_nginx_log_format.sh"
  exit 1
fi

command -v nginx >/dev/null 2>&1 || { echo "nginx kurulu degil" >&2; exit 1; }
[[ -f "$NGINX_MAIN" ]] || { echo "nginx.conf yok: $NGINX_MAIN" >&2; exit 1; }

install -d /etc/nginx/snippets
install -m 644 "$ROOT/examples/nginx/snippets/log-guardian.conf" "$SNIP_DST"
install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-server.conf" "$SNIP_SERVER_DST"

# log_format http{} icinde — nested include yerine inline (yukleme sirasi sorunu onlenir)
cat >"$HTTP_INLINE" <<'EOF'
# Linux Log Guardian — log_format + limit zones (http context only)
log_format log_guardian '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent "$http_referer" '
    '"$http_user_agent" "$http_x_forwarded_for" '
    '"$request_body"';
limit_req_zone  $binary_remote_addr zone=lg_general:10m rate=30r/s;
limit_req_zone  $binary_remote_addr zone=lg_login:10m   rate=5r/m;
limit_conn_zone $binary_remote_addr zone=lg_conn:10m;
EOF
echo "[OK] inline format: $HTTP_INLINE"

# Eski conf.d drop-in kaldir (duplicate veya yanlis sira)
[[ -f "$HTTP_DROPIN_OLD" ]] && rm -f "$HTTP_DROPIN_OLD" && echo "[OK] eski drop-in silindi: $HTTP_DROPIN_OLD"

# nginx.conf: http { hemen sonrasina include (sites-enabled'dan ONCE)
python3 <<PY
import re
import shutil
from datetime import datetime
from pathlib import Path

nginx_main = Path("$NGINX_MAIN")
include_line = "    include /etc/nginx/snippets/log-guardian-http-inline.conf;  # $MARKER"
text = nginx_main.read_text(encoding="utf-8", errors="replace")

if "$MARKER" not in text:
    bak = nginx_main.with_name(f"nginx.conf.bak.{datetime.now():%Y%m%d}")
    shutil.copy2(nginx_main, bak)
    new, n = re.subn(
        r"(http\s*\{)",
        r"\1\n" + include_line,
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit("http {} blogu bulunamadi — manuel include ekleyin")
    nginx_main.write_text(new, encoding="utf-8")
    print(f"[OK] nginx.conf guncellendi (yedek: {bak.name})")
else:
    print("[OK] nginx.conf zaten log-guardian include iciyor")
PY

# Site: access_log log_guardian
python3 <<'PY'
import glob
import re
import shutil
from datetime import datetime
from pathlib import Path

ACCESS = "access_log /var/log/nginx/access.log log_guardian;"
SKIP = {
    "/etc/nginx/snippets/log-guardian-http-inline.conf",
    "/etc/nginx/conf.d/00-log-guardian-http.conf",
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
    if rp in SKIP or path.name == "00-log-guardian-http.conf":
        continue
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    if "listen" not in text or "80" not in text:
        continue
    if re.search(r"access_log\s+\S+\s+log_guardian", text):
        print(f"[OK] zaten log_guardian: {path}")
        continue

    new = text
    if re.search(r"access_log\s+", text):
        new = re.sub(r"access_log\s+[^;]+;", ACCESS, text, count=1)
    else:
        m = re.search(r"(listen\s+[^;]*80[^;]*;)", text)
        if not m:
            continue
        new = text[: m.end()] + "\n    " + ACCESS + text[m.end() :]

    if new != text:
        bak = path.with_suffix(path.suffix + f".bak.{datetime.now():%Y%m%d}")
        shutil.copy2(path, bak)
        path.write_text(new, encoding="utf-8")
        print(f"[OK] access_log log_guardian -> {path} (yedek: {bak.name})")
PY

if ! nginx -t 2>&1; then
  echo "[FAIL] nginx -t basarisiz — default.bak.* dosyasindan geri yukleyebilirsiniz" >&2
  exit 1
fi
systemctl reload nginx
echo "[OK] nginx reload"

if bash "$ROOT/scripts/check_nginx_log_format.sh"; then
  echo "[OK] fix_nginx_log_format tamam"
else
  exit 1
fi
