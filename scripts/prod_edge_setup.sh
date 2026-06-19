#!/usr/bin/env bash
# Prod edge sertlestirme — tek komut (root onerilir)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[prod_edge_setup] FAIL: $*" >&2; exit 1; }
warn() { echo "[prod_edge_setup] WARN: $*" >&2; }

[[ "${EUID:-$(id -u)}" -eq 0 ]] || warn "Root degilsiniz — bazi adimlar sudo gerektirir"

echo "=== prod_edge_setup ==="

# 1) Binary + threat_intel sync (install.sh ile ayni mantik)
if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  PREFIX="${PREFIX:-/usr/local}"
  CONF_DIR="/etc/log-guardian"
  install -d "$CONF_DIR"
  install -m 755 "$ROOT/threat_intel.sh" "$PREFIX/bin/log-guardian-threatintel"
  echo "[OK] threat_intel -> $PREFIX/bin/log-guardian-threatintel"

  if [[ -f "$ROOT/log-guardian" ]]; then
    install -m 755 "$ROOT/log-guardian" "$PREFIX/bin/log-guardian"
    echo "[OK] log-guardian binary sync"
  elif [[ -x "$PREFIX/bin/log-guardian" ]]; then
    echo "[OK] mevcut $PREFIX/bin/log-guardian"
  else
    warn "log-guardian binary yok — once: sudo bash install.sh"
  fi

  # rules.conf prod anahtarlari (mevcut kurulumda patch)
  if [[ -f "$CONF_DIR/rules.conf" ]]; then
    grep -q '^DB_PATH=' "$CONF_DIR/rules.conf" && \
      sed -i "s|^DB_PATH=.*|DB_PATH=$CONF_DIR/events.db|" "$CONF_DIR/rules.conf" || \
      echo "DB_PATH=$CONF_DIR/events.db" >> "$CONF_DIR/rules.conf"
    grep -q '^INTEL_BAN_DB_TTL_DAYS=' "$CONF_DIR/rules.conf" && \
      sed -i 's|^INTEL_BAN_DB_TTL_DAYS=.*|INTEL_BAN_DB_TTL_DAYS=7|' "$CONF_DIR/rules.conf" || \
      echo 'INTEL_BAN_DB_TTL_DAYS=7' >> "$CONF_DIR/rules.conf"
    echo "[OK] rules.conf DB_PATH + INTEL_BAN_DB_TTL_DAYS"
  fi

  # Legacy DB temizligi (tek seferlik etkili)
  if [[ -f "$CONF_DIR/events.db" ]] && command -v sqlite3 >/dev/null; then
    legacy=$(sqlite3 "$CONF_DIR/events.db" \
      "DELETE FROM ban_events WHERE reason='threat-intel' AND ip != 'system'; SELECT changes();" \
      2>/dev/null || echo 0)
    [[ "${legacy:-0}" -gt 0 ]] && echo "[OK] legacy threat-intel silindi: $legacy satir"
  fi
else
  warn "Root olmadan threat_intel/rules sync atlandi"
fi

# 2) nginx snippet
if [[ "${EUID:-$(id -u)}" -eq 0 ]] && command -v nginx >/dev/null; then
  install -d /etc/nginx/snippets
  install -m 644 "$ROOT/examples/nginx/snippets/log-guardian.conf" /etc/nginx/snippets/
  install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-server.conf" /etc/nginx/snippets/
  echo "[OK] nginx snippets -> /etc/nginx/snippets/"
  if [[ -d /etc/nginx/conf.d ]] && [[ ! -f /etc/nginx/conf.d/log-guardian-cloudflare.conf ]]; then
    install -m 644 "$ROOT/deploy/cloudflare-origin.conf" /etc/nginx/conf.d/log-guardian-cloudflare.conf
    echo "[OK] Cloudflare real_ip -> /etc/nginx/conf.d/log-guardian-cloudflare.conf"
    echo "     (kullanmiyorsaniz dosyayi silin veya yorumlayin)"
  fi
  if nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || true
    echo "[OK] nginx -t + reload"
  else
    warn "nginx -t FAIL — snippet'leri site config'inize include edin: docs/EDGE_PROTECTION.md"
  fi
  if STRICT_EXIT=1 bash "$ROOT/scripts/enforce_nginx_log_format.sh"; then
    echo "[OK] log_guardian format (STRICT)"
  else
    warn "log_guardian format kurulamadi — sudo bash scripts/fix_nginx_log_format.sh"
  fi
  install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-inline-consult.conf" /etc/nginx/snippets/ 2>/dev/null || true
  install -m 644 "$ROOT/examples/nginx/snippets/log-guardian-inline-server.conf" /etc/nginx/snippets/ 2>/dev/null || true
  bash "$ROOT/scripts/merge_nginx_inline_consult.sh" 2>/dev/null || true
  systemctl restart log-guardian 2>/dev/null || true
  sleep 2
  if STRICT_EXIT=1 bash "$ROOT/scripts/enforce_nginx_inline_consult.sh"; then
    echo "[OK] inline consult (STRICT)"
  else
    warn "inline consult kurulamadi — sudo bash scripts/fix_nginx_inline_consult.sh"
  fi
else
  echo "[INFO] nginx yok veya root degil — snippet manuel: examples/nginx/snippets/"
fi

# 3) Threat intel prod (timer + TTL + sync)
if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  if bash "$ROOT/scripts/enable_threat_intel_prod.sh"; then
    echo "[OK] threat intel prod bootstrap"
  else
    warn "threat intel prod — sudo bash scripts/enable_threat_intel_prod.sh"
  fi
  if bash "$ROOT/scripts/threat_intel_prod_proof.sh"; then
    echo "[OK] threat_intel_prod_proof"
  else
    warn "threat_intel_prod_proof eksik — fixture: THREAT_INTEL_FIXTURE=corpus/fixtures/firehol_sample.netset"
  fi
else
  warn "Root olmadan threat intel prod atlandi"
fi

# 4) NIC / XDP
bash "$ROOT/scripts/prod_nic_xdp_check.sh"

# 5) Whitelist hatirlatma
if [[ -f /etc/log-guardian/rules.conf ]]; then
  n=$(grep -c '^WHITELIST_IP=' /etc/log-guardian/rules.conf 2>/dev/null || echo 0)
  if [[ "$n" -le 2 ]]; then
    warn "WHITELIST_IP yalnizca localhost — ofis/monitoring IP ekleyin: docs/EDGE_PROTECTION.md"
  else
    echo "[OK] WHITELIST_IP satirlari: $n"
  fi
fi

# 6) Hibrit kanit (inline + log)
if curl -sf --max-time 2 http://127.0.0.1:80/ -o /dev/null 2>/dev/null; then
  echo "--- nginx_hybrid_proof ---"
  bash "$ROOT/scripts/nginx_hybrid_proof.sh" || warn "nginx_hybrid_proof eksik (inline veya log format?)"
  echo "--- nginx_attack_test ---"
  bash "$ROOT/scripts/nginx_attack_test.sh" || warn "nginx_attack_test tam ban kaniti vermedi (log formati?)"
else
  echo "[SKIP] nginx_hybrid_proof — :80 kapali"
fi

echo ""
echo "[OK] prod_edge_setup tamam"
echo "  CDN: docs/EDGE_PROTECTION.md"
echo "  Tam kurulum: sudo bash install.sh"
