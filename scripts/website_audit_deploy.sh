#!/usr/bin/env bash
# Deploy paketi denetimi — sızıntı / harici URL / secret tarama
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="$ROOT/assets/website-deploy"
FAIL=0

bad() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
ok() { echo "  [OK] $*"; }

[[ -d "$DEPLOY" ]] || { bad "website-deploy yok — once pack_deploy"; exit 1; }

echo "=== website_audit_deploy ==="

# Hassas dosya
for f in csp.txt publish.allowlist .env; do
  if find "$DEPLOY" -name "$f" | grep -q .; then
    bad "deploy icinde $f"
  fi
done
[[ $FAIL -eq 0 ]] && ok "hassas dosya yok"

# Secret pattern
if grep -rIlE '(BEGIN (RSA |EC )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{20,})' "$DEPLOY" 2>/dev/null; then
  bad "secret pattern deploy icinde"
else
  ok "secret pattern yok"
fi

# Harici kaynak yukleme (yalnizca GitHub repo linkleri izinli)
_ext_urls() {
  grep -oE '(href|src)="https?://[^"]+' "$DEPLOY/index.html" 2>/dev/null \
    | sed 's/^[^"]*"//' || true
}
if bad_urls="$(_ext_urls | grep -vE '^https://github\.com/kurtulusutkucenik/Linux-Log-Guardian' || true)" && [[ -n "$bad_urls" ]]; then
  bad "index.html dis kaynak attribute"
elif grep -qE '(href|src)="https?://' "$DEPLOY/index.html" 2>/dev/null; then
  ok "harici link (GitHub repo)"
elif grep -qE 'fetch\(|import\(|\.src\s*=' "$DEPLOY/i18n.js" 2>/dev/null \
     && grep -qE 'https?://' "$DEPLOY/i18n.js" 2>/dev/null; then
  bad "i18n.js dis kaynak yukleme"
else
  ok "harici kaynak yukleme yok"
fi

# Kaynak map
if find "$DEPLOY" -name '*.map' | grep -q .; then
  bad "source map deploy icinde"
else
  ok "source map yok"
fi

CSS_LINK="$(grep -oP 'href="(?:\./|/)\Ksite[^"]+\.css' "$DEPLOY/index.html" 2>/dev/null | head -1 || true)"
if [[ -z "$CSS_LINK" ]]; then
  bad "index.html site*.css link yok"
elif [[ ! -f "$DEPLOY/$CSS_LINK" ]]; then
  bad "deploy paketinde CSS eksik: $CSS_LINK"
else
  ok "versioned CSS deploy'da: $CSS_LINK"
fi

# Manifest (repo kokunde, deploy disinda)
MANIFEST="$ROOT/assets/website-deploy.manifest.json"
if [[ -f "$MANIFEST" ]]; then
  if python3 <<PY
import hashlib, json, sys
from pathlib import Path
deploy = Path("$DEPLOY")
manifest = json.loads(Path("$MANIFEST").read_text())
for rel, expected in manifest["files"].items():
    p = deploy / rel
    if not p.is_file():
        print(f"  [FAIL] manifest dosya eksik: {rel}")
        sys.exit(1)
    h = hashlib.sha384(p.read_bytes()).hexdigest()
    if h != expected:
        print(f"  [FAIL] manifest hash uyumsuz: {rel}")
        sys.exit(1)
print("  [OK] deploy manifest hash")
PY
  then
    :
  else
    bad "deploy manifest hash"
  fi
else
  bad "website-deploy.manifest.json yok"
fi

if [[ $FAIL -eq 0 ]]; then
  echo "[OK] website_audit_deploy"
  exit 0
fi
echo "[FAIL] website_audit_deploy ($FAIL hata)"
exit 1
