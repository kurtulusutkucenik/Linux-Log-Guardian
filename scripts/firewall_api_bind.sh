#!/usr/bin/env bash
# API portu (8090) — yalnizca localhost + docker agi; dis LAN DROP
#   source scripts/firewall_api_bind.sh
#   lg_firewall_api_bind_install && echo ok
#   lg_firewall_api_bind_check && echo rule_ok
set -euo pipefail

LG_API_PORT="${LG_API_PORT:-8090}"
LG_API_LOCAL_CIDR="${LG_API_LOCAL_CIDR:-127.0.0.0/8}"
LG_API_DOCKER_CIDR="${LG_API_DOCKER_CIDR:-172.16.0.0/12}"
LG_NFT_TABLE="${LG_NFT_TABLE:-log_guardian}"
LG_NFT_CHAIN="${LG_NFT_CHAIN:-lg_api_chain}"
LG_FW_STAMP="${LG_FW_STAMP:-/var/lib/log-guardian/firewall-api-bind.method}"

_lg_iptables_rule_ok() {
  command -v iptables >/dev/null 2>&1 || return 1
  iptables -C INPUT -p tcp --dport "$LG_API_PORT" \
    ! -s "$LG_API_LOCAL_CIDR" ! -s "$LG_API_DOCKER_CIDR" -j DROP 2>/dev/null
}

_lg_iptables_rule_add() {
  command -v iptables >/dev/null 2>&1 || return 1
  _lg_iptables_rule_ok && return 0
  iptables -I INPUT -p tcp --dport "$LG_API_PORT" \
    ! -s "$LG_API_LOCAL_CIDR" ! -s "$LG_API_DOCKER_CIDR" -j DROP 2>/dev/null
}

_lg_nft_rule_ok() {
  command -v nft >/dev/null 2>&1 || return 1
  local out=""
  if [[ "$(id -u)" -eq 0 ]]; then
    out=$(nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" 2>/dev/null || true)
  elif sudo -n true 2>/dev/null; then
    out=$(sudo -n nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" 2>/dev/null || true)
  fi
  if [[ -n "$out" ]] && echo "$out" | grep -qE "dport ${LG_API_PORT}.*drop"; then
    return 0
  fi
  # Eski kurulum: chain adi lg_api_input
  if [[ "$(id -u)" -eq 0 ]]; then
    out=$(nft list chain "inet" "$LG_NFT_TABLE" lg_api_input 2>/dev/null || true)
  elif sudo -n true 2>/dev/null; then
    out=$(sudo -n nft list chain "inet" "$LG_NFT_TABLE" lg_api_input 2>/dev/null || true)
  fi
  [[ -n "$out" ]] && echo "$out" | grep -qE "dport ${LG_API_PORT}.*drop"
}

_lg_stamp_ok() {
  [[ -r "$LG_FW_STAMP" ]] && grep -qE '^(iptables|nftables|ufw)$' "$LG_FW_STAMP" 2>/dev/null
}

_lg_stamp_write() {
  local method="$1"
  mkdir -p "$(dirname "$LG_FW_STAMP")"
  echo "$method" >"$LG_FW_STAMP"
  chmod 644 "$LG_FW_STAMP" 2>/dev/null || true
}

_lg_nft_rule_add() {
  command -v nft >/dev/null 2>&1 || return 1
  _lg_nft_rule_ok && return 0
  nft list table "inet" "$LG_NFT_TABLE" >/dev/null 2>&1 \
    || nft add table "inet" "$LG_NFT_TABLE"
  nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" >/dev/null 2>&1 \
    || nft add chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" \
      '{ type filter hook input priority filter - 5; policy accept; }'
  nft add rule "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" \
    tcp dport "$LG_API_PORT" \
    ip saddr != "$LG_API_LOCAL_CIDR" \
    ip saddr != "$LG_API_DOCKER_CIDR" \
    counter drop
}

_lg_ufw_active() {
  command -v ufw >/dev/null 2>&1 || return 1
  ufw status 2>/dev/null | grep -qiE '^Status:\s*active'
}

_lg_ufw_rule_ok() {
  _lg_ufw_active || return 1
  ufw status 2>/dev/null | grep -qE "${LG_API_PORT}/tcp.*DENY"
}

_lg_ufw_rule_add() {
  _lg_ufw_active || return 1
  _lg_ufw_rule_ok && return 0
  ufw allow from "$LG_API_LOCAL_CIDR" to any port "$LG_API_PORT" proto tcp \
    comment 'log-guardian api localhost' >/dev/null 2>&1 || true
  ufw allow from "$LG_API_DOCKER_CIDR" to any port "$LG_API_PORT" proto tcp \
    comment 'log-guardian api docker' >/dev/null 2>&1 || true
  ufw --force deny "$LG_API_PORT"/tcp comment 'log-guardian api block' >/dev/null 2>&1
}

# Kur: iptables -> nftables -> ufw (aktifse). stdout: yontem adi
lg_firewall_api_bind_install() {
  if _lg_iptables_rule_add; then
    _lg_stamp_write iptables
    echo "iptables"
    return 0
  fi
  if _lg_nft_rule_add; then
    _lg_stamp_write nftables
    echo "nftables"
    return 0
  fi
  if _lg_ufw_rule_add; then
    _lg_stamp_write ufw
    echo "ufw"
    return 0
  fi
  return 1
}

lg_firewall_api_bind_check() {
  _lg_iptables_rule_ok && return 0
  _lg_nft_rule_ok && return 0
  _lg_ufw_rule_ok && return 0
  _lg_stamp_ok && return 0
  return 1
}

lg_firewall_api_bind_method() {
  if _lg_iptables_rule_ok; then echo "iptables"; return 0; fi
  if _lg_nft_rule_ok; then echo "nftables"; return 0; fi
  if _lg_ufw_rule_ok; then echo "ufw"; return 0; fi
  if _lg_stamp_ok; then cat "$LG_FW_STAMP"; return 0; fi
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "${1:-install}" in
    install)
      if m=$(lg_firewall_api_bind_install); then
        echo "[OK] firewall_api_bind ($m) — port ${LG_API_PORT}"
      else
        echo "[FAIL] firewall_api_bind — iptables/nftables/ufw basarisiz" >&2
        exit 1
      fi
      ;;
    check)
      if lg_firewall_api_bind_check; then
        echo "[OK] firewall_api_bind ($(lg_firewall_api_bind_method)) — port ${LG_API_PORT}"
      else
        echo "[FAIL] firewall_api_bind kurali yok" >&2
        exit 1
      fi
      ;;
    *)
      echo "Kullanim: $0 [install|check]" >&2
      exit 1
      ;;
  esac
fi
