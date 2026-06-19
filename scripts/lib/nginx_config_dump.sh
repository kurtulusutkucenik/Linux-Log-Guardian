#!/usr/bin/env bash
# nginx yapilandirma metni — nginx -T veya /etc/nginx dosya fallback
#   source scripts/lib/nginx_config_dump.sh
#   nginx_config_text | grep log_guardian
nginx_config_text() {
  local t=""
  if command -v nginx >/dev/null 2>&1; then
    if [[ "$(id -u)" -eq 0 ]]; then
      t=$(nginx -T 2>/dev/null || true)
    elif command -v sudo >/dev/null 2>&1; then
      t=$(sudo -n nginx -T 2>/dev/null || sudo nginx -T 2>/dev/null || nginx -T 2>/dev/null || true)
    else
      t=$(nginx -T 2>/dev/null || true)
    fi
  fi
  if [[ -n "$t" ]]; then
    printf '%s' "$t"
    return 0
  fi
  # sudo/nginx -T yok — bilinen dosyalar (include zinciri tam degil ama snippet yeterli)
  local f
  shopt -s nullglob
  for f in /etc/nginx/nginx.conf \
           /etc/nginx/conf.d/*.conf \
           /etc/nginx/sites-available/* \
           /etc/nginx/sites-enabled/* \
           /etc/nginx/snippets/*.conf; do
    [[ -r "$f" ]] && cat "$f"
    if [[ ! -r "$f" ]] && command -v sudo >/dev/null 2>&1; then
      sudo cat "$f" 2>/dev/null || true
    fi
  done
  shopt -u nullglob
}
