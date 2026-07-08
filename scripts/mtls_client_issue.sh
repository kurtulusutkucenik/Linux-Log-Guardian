#!/usr/bin/env bash
# Enterprise ban API — yerel mTLS PKI (CA + istemci + nginx lab sunucu)
#   bash scripts/mtls_client_issue.sh
#   MTLS_DIR=/etc/log-guardian/mtls sudo bash scripts/mtls_client_issue.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MTLS_DIR="${MTLS_DIR:-$ROOT/.cache/mtls-lab}"
CLIENT_CN="${MTLS_CLIENT_CN:-log-guardian-soar-client}"
DAYS="${MTLS_CERT_DAYS:-825}"
FORCE="${MTLS_REISSUE:-0}"

mkdir -p "$MTLS_DIR/logs" "$MTLS_DIR/tmp"

if [[ "$FORCE" != "1" && -f "$MTLS_DIR/client.crt" && -f "$MTLS_DIR/ca.crt" ]]; then
  echo "[OK] mtls_client_issue — mevcut: $MTLS_DIR"
  exit 0
fi

echo "=== mtls_client_issue ==="
echo "  dir=$MTLS_DIR  cn=$CLIENT_CN"

openssl genrsa -out "$MTLS_DIR/ca.key" 4096 2>/dev/null
openssl req -x509 -new -nodes -key "$MTLS_DIR/ca.key" -sha256 -days "$DAYS" \
  -subj "/CN=Log Guardian mTLS CA/O=Log Guardian/C=TR" \
  -out "$MTLS_DIR/ca.crt"

openssl genrsa -out "$MTLS_DIR/server.key" 2048 2>/dev/null
openssl req -new -key "$MTLS_DIR/server.key" \
  -subj "/CN=localhost/O=Log Guardian API mTLS/C=TR" \
  -out "$MTLS_DIR/server.csr"
openssl x509 -req -in "$MTLS_DIR/server.csr" -CA "$MTLS_DIR/ca.crt" -CAkey "$MTLS_DIR/ca.key" \
  -CAcreateserial -out "$MTLS_DIR/server.crt" -days "$DAYS" -sha256 2>/dev/null
rm -f "$MTLS_DIR/server.csr" "$MTLS_DIR/ca.srl"

openssl genrsa -out "$MTLS_DIR/client.key" 2048 2>/dev/null
openssl req -new -key "$MTLS_DIR/client.key" \
  -subj "/CN=${CLIENT_CN}/O=Log Guardian SOAR/C=TR" \
  -out "$MTLS_DIR/client.csr"
openssl x509 -req -in "$MTLS_DIR/client.csr" -CA "$MTLS_DIR/ca.crt" -CAkey "$MTLS_DIR/ca.key" \
  -CAcreateserial -out "$MTLS_DIR/client.crt" -days "$DAYS" -sha256 2>/dev/null
rm -f "$MTLS_DIR/client.csr" "$MTLS_DIR/ca.srl"

cat "$MTLS_DIR/client.crt" "$MTLS_DIR/client.key" >"$MTLS_DIR/client.pem"
chmod 600 "$MTLS_DIR"/*.key "$MTLS_DIR/client.pem" 2>/dev/null || true

SNIP="$ROOT/examples/nginx/snippets/log-guardian-api-mtls.conf"
if [[ -f "$SNIP" ]]; then
  cp "$SNIP" "$MTLS_DIR/log-guardian-api-mtls.snippet"
fi

python3 - "$MTLS_DIR" "$ROOT/examples/nginx-api-mtls.conf" <<'PY'
import sys
from pathlib import Path

mtls = Path(sys.argv[1]).resolve()
tpl = Path(sys.argv[2])
text = tpl.read_text(encoding="utf-8")
# __MTLS_DIR__ nginx-mtls-lab.conf icinde tirnakli; run.conf sed ile doldurulur
(mtls / "nginx-mtls-lab.conf").write_text(text, encoding="utf-8")
PY

echo "[OK] mtls_client_issue"
echo "  ca.crt      -> $MTLS_DIR/ca.crt"
echo "  client.crt  -> $MTLS_DIR/client.crt"
echo "  client.key  -> $MTLS_DIR/client.key"
echo "  nginx lab   -> $MTLS_DIR/nginx-mtls-lab.conf"
echo "  test        -> bash scripts/ban_api_mtls_e2e.sh"
