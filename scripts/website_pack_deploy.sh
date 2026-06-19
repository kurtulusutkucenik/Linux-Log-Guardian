#!/usr/bin/env bash
# Yalnizca allowlist dosyalarini deploy dizinine kopyala (hassas config haric)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets/website"
OUT="$ROOT/assets/website-deploy"
MANIFEST="$ROOT/assets/website-deploy.manifest.json"
ALLOWLIST="$SRC/publish.allowlist"

[[ -f "$ALLOWLIST" ]] || { echo "[website_pack_deploy] FAIL: publish.allowlist yok" >&2; exit 1; }

rm -rf "$OUT"
mkdir -p "$OUT"

count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
  src_file="$SRC/$line"
  [[ -f "$src_file" ]] || { echo "[website_pack_deploy] FAIL: eksik $line" >&2; exit 1; }
  dest_file="$OUT/$line"
  mkdir -p "$(dirname "$dest_file")"
  cp -f "$src_file" "$dest_file"
  count=$((count + 1))
done < "$ALLOWLIST"

for cfg in _headers _redirects robots.txt; do
  cp -f "$SRC/$cfg" "$OUT/$cfg"
done

for forbidden in csp.txt publish.allowlist logo-transparent.png; do
  if [[ -e "$OUT/$forbidden" ]]; then
    echo "[website_pack_deploy] FAIL: deploy paketinde $forbidden" >&2
    exit 1
  fi
done

python3 <<PY
import hashlib
import json
from pathlib import Path

deploy = Path("$OUT")
manifest = {"files": {}}
for path in sorted(deploy.rglob("*")):
    if path.is_file():
        rel = path.relative_to(deploy).as_posix()
        manifest["files"][rel] = hashlib.sha384(path.read_bytes()).hexdigest()
Path("$MANIFEST").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"[OK] manifest -> {len(manifest['files'])} dosya hash")
PY

echo "[OK] website_pack_deploy -> $OUT ($count dosya + 3 config)"
