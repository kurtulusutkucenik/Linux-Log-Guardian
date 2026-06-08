#!/usr/bin/env bash
# nginx TLS :443 — JA3 live proof icin self-signed + log_guardian
#   sudo bash scripts/nginx_tls_local_setup.sh
#   openssl s_client -connect 127.0.0.1:443 -servername localhost </dev/null
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SSL_DIR="${LG_TLS_SSL_DIR:-/etc/nginx/ssl/log-guardian}"
SITE_AVAIL="/etc/nginx/sites-available/log-guardian-tls-443.conf"
SITE_LINK="/etc/nginx/sites-enabled/log-guardian-tls-443.conf"

fail() { echo "[nginx_tls_local] FAIL: $*" >&2; exit 1; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/nginx_tls_local_setup.sh" >&2
  exit 1
fi

command -v nginx >/dev/null 2>&1 || fail "nginx kurulu degil"
command -v openssl >/dev/null 2>&1 || fail "openssl kurulu degil"

echo "=== nginx_tls_local_setup ==="

bash "$ROOT/scripts/fix_nginx_log_format.sh" 2>/dev/null || true
install -d /etc/nginx/snippets
install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-tls-443.conf" /etc/nginx/snippets/

install -d "$SSL_DIR"
if [[ ! -f "$SSL_DIR/selfsigned.crt" ]]; then
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "$SSL_DIR/selfsigned.key" \
    -out "$SSL_DIR/selfsigned.crt" \
    -subj "/CN=localhost/O=Log Guardian Local TLS" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null \
    || openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
      -keyout "$SSL_DIR/selfsigned.key" \
      -out "$SSL_DIR/selfsigned.crt" \
      -subj "/CN=localhost/O=Log Guardian Local TLS"
  chmod 600 "$SSL_DIR/selfsigned.key"
  echo "[OK] self-signed cert: $SSL_DIR"
fi

install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
cat >"$SITE_AVAIL" <<EOF
# Linux Log Guardian — TLS :443 (JA3 live proof)
server {
    ssl_certificate     $SSL_DIR/selfsigned.crt;
    ssl_certificate_key $SSL_DIR/selfsigned.key;
    include /etc/nginx/snippets/log-guardian-tls-443.conf;
}
EOF

ln -sf "$SITE_AVAIL" "$SITE_LINK"
echo "[OK] site: $SITE_AVAIL"

nginx -t || fail "nginx -t basarisiz"
systemctl reload nginx 2>/dev/null || nginx -s reload
echo "[OK] nginx reload"

if timeout 3 openssl s_client -connect 127.0.0.1:443 -servername localhost </dev/null 2>/dev/null \
   | grep -q "BEGIN CERTIFICATE"; then
  echo "[OK] TLS :443 yanit veriyor"
else
  echo "[WARN] :443 probe basarisiz — port kapali veya baska server block oncelikli"
fi

echo ""
echo "Sonraki adim:"
echo "  LIVE=1 bash scripts/ja3_cluster_proof.sh"
echo "  sudo systemctl restart log-guardian-daemon log-guardian  # eBPF JA3 icin"
