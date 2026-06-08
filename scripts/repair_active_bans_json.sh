#!/usr/bin/env bash
# active_bans.json — ipset ozeti; export max 500 IP + total_count (Faz 1).
# Legacy 60K+ DB export dosyalarini dashboard icin kirpar veya ipset'ten yeniden yazar.
set -euo pipefail

BANS_JSON="${1:-/run/log-guardian/active_bans.json}"
EXPORT_MAX="${BANS_JSON_EXPORT_MAX:-500}"
TMP="${BANS_JSON}.repair.tmp"

repair_from_file() {
  python3 - "$BANS_JSON" "$TMP" "$EXPORT_MAX" <<'PY'
import json, sys
src, dst, cap = sys.argv[1], sys.argv[2], int(sys.argv[3])
try:
    with open(src) as f:
        d = json.load(f)
except (OSError, json.JSONDecodeError):
    sys.exit(1)
ips = d.get("ips") or []
total = int(d.get("total_count") or len(ips))
out = {
    "ips": ips[:cap],
    "total_count": total,
    "truncated": total > len(ips[:cap]),
    "source": d.get("source") or "ipset",
}
with open(dst, "w") as f:
    json.dump(out, f, separators=(",", ":"))
    f.write("\n")
PY
}

export_from_ipset() {
  python3 - "$TMP" "$EXPORT_MAX" <<'PY'
import json, subprocess, sys
dst, cap = sys.argv[1], int(sys.argv[2])
try:
    out = subprocess.check_output(
        ["/sbin/ipset", "list", "log_analyzer_block_v4", "-o", "plain"],
        stderr=subprocess.DEVNULL, text=True,
    )
except (subprocess.CalledProcessError, FileNotFoundError):
    sys.exit(1)
ips = []
for line in out.splitlines():
    ip = line.split()[0] if line.split() else ""
    if "." in ip:
        ips.append(ip)
total = len(ips)
doc = {
    "ips": ips[:cap],
    "total_count": total,
    "truncated": total > cap,
    "source": "ipset",
}
with open(dst, "w") as f:
    json.dump(doc, f, separators=(",", ":"))
    f.write("\n")
PY
}

if [[ ! -f "$BANS_JSON" ]]; then
  if export_from_ipset 2>/dev/null; then
    install -m 644 "$TMP" "$BANS_JSON"
    rm -f "$TMP"
    echo "[repair] $BANS_JSON ipset'ten olusturuldu"
    exit 0
  fi
  exit 0
fi

size=$(stat -c%s "$BANS_JSON" 2>/dev/null || echo 0)
needs=0
if [[ "$size" -gt 65536 ]]; then needs=1; fi
if ! grep -q '"total_count"' "$BANS_JSON" 2>/dev/null; then needs=1; fi

if [[ "$needs" -eq 0 ]]; then
  exit 0
fi

if export_from_ipset 2>/dev/null; then
  :
elif repair_from_file; then
  :
else
  exit 0
fi

mv -f "$TMP" "$BANS_JSON"
chmod 644 "$BANS_JSON" 2>/dev/null || true
echo "[repair] $BANS_JSON guncellendi (max $EXPORT_MAX IP, total_count)"
