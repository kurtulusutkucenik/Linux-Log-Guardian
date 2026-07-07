# shellcheck shell=bash
# VirtualBox guest + offline VM yardimcilari (ban hattina dokunmaz)

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

lg_guest_has_outbound() {
  [[ "${LG_FORCE_OFFLINE:-0}" == "1" ]] && return 1
  curl -sf --max-time 4 -o /dev/null http://1.1.1.1 2>/dev/null && return 0
  curl -sf --max-time 6 -o /dev/null \
    http://www.ipdeny.com/ipblocks/data/allocated/aggregated/cn-aggregated.zone 2>/dev/null
}

# VM offline: ipdeny indirme gurultusu + yavas restart onleme
lg_vm_offline_geoip_quiet() {
  local rules="${LG_RULES:-/etc/log-guardian/rules.conf}"
  local env="${LG_CONF:-/etc/log-guardian}/env"
  [[ -f "$rules" ]] || return 0

  if grep -qE '^BLOCK_COUNTRIES=.+' "$rules" 2>/dev/null; then
    if grep -q '^BLOCK_COUNTRIES=' "$rules" 2>/dev/null; then
      sed -i 's|^BLOCK_COUNTRIES=.*|BLOCK_COUNTRIES=|' "$rules"
    else
      echo 'BLOCK_COUNTRIES=' >>"$rules"
    fi
    echo "[vm_guest] BLOCK_COUNTRIES bos — offline VM (GEOIP_OFFLINE_CSV yeterli)"
  fi

  install -d -m 0750 "$(dirname "$env")"
  touch "$env"
  chmod 640 "$env" 2>/dev/null || true
  if grep -q '^GEOIP_FEED_SKIP=' "$env" 2>/dev/null; then
    sed -i 's|^GEOIP_FEED_SKIP=.*|GEOIP_FEED_SKIP=1|' "$env"
  else
    echo 'GEOIP_FEED_SKIP=1' >>"$env"
  fi
  echo "[vm_guest] GEOIP_FEED_SKIP=1 -> $env"
}
