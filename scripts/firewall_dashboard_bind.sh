#!/usr/bin/env bash
# Dashboard TLS portu (8443) — localhost + docker + VM NAT; dis LAN DROP
#   sudo bash scripts/firewall_dashboard_bind.sh install
#   bash scripts/firewall_dashboard_bind.sh check
# VM filo (VirtualBox NAT): varsayilan 10.0.2.0/24 izinli — LG_DASHBOARD_EXTRA_CIDRS ile degistir
set -euo pipefail

LG_DASHBOARD_PORT="${LG_DASHBOARD_PORT:-8443}"
LG_DASHBOARD_LOCAL_CIDR="${LG_DASHBOARD_LOCAL_CIDR:-127.0.0.0/8}"
LG_DASHBOARD_DOCKER_CIDR="${LG_DASHBOARD_DOCKER_CIDR:-172.16.0.0/12}"
LG_DASHBOARD_EXTRA_CIDRS="${LG_DASHBOARD_EXTRA_CIDRS:-10.0.2.0/24}"
LG_NFT_TABLE="${LG_NFT_TABLE:-log_guardian}"
LG_NFT_CHAIN="${LG_NFT_CHAIN:-lg_dashboard_chain}"
LG_FW_STAMP="${LG_FW_STAMP:-/var/lib/log-guardian/firewall-dashboard-bind.method}"

_lg_dashboard_allowed_cidrs() {
  local c
  echo "$LG_DASHBOARD_LOCAL_CIDR"
  echo "$LG_DASHBOARD_DOCKER_CIDR"
  for c in $LG_DASHBOARD_EXTRA_CIDRS; do
    [[ -n "$c" ]] && echo "$c"
  done
}

_lg_iptables_rule_ok() {
  command -v iptables >/dev/null 2>&1 || return 1
  local c args=(-C INPUT -p tcp --dport "$LG_DASHBOARD_PORT")
  for c in $(_lg_dashboard_allowed_cidrs); do
    args+=(! -s "$c")
  done
  args+=(-j DROP)
  iptables "${args[@]}" 2>/dev/null
}

_lg_iptables_rule_add() {
  command -v iptables >/dev/null 2>&1 || return 1
  _lg_iptables_rule_ok && return 0
  local c args=(-I INPUT -p tcp --dport "$LG_DASHBOARD_PORT")
  for c in $(_lg_dashboard_allowed_cidrs); do
    args+=(! -s "$c")
  done
  args+=(-j DROP)
  iptables "${args[@]}" 2>/dev/null
}

_lg_nft_rule_ok() {
  command -v nft >/dev/null 2>&1 || return 1
  local out=""
  if [[ "$(id -u)" -eq 0 ]]; then
    out=$(nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" 2>/dev/null || true)
  elif sudo -n true 2>/dev/null; then
    out=$(sudo -n nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" 2>/dev/null || true)
  fi
  [[ -n "$out" ]] && echo "$out" | grep -qE "dport ${LG_DASHBOARD_PORT}.*drop"
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
  local c nft_args=(tcp dport "$LG_DASHBOARD_PORT")
  for c in $(_lg_dashboard_allowed_cidrs); do
    nft_args+=(ip saddr != "$c")
  done
  nft_args+=(counter drop)
  nft list table "inet" "$LG_NFT_TABLE" >/dev/null 2>&1 \
    || nft add table "inet" "$LG_NFT_TABLE"
  nft list chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" >/dev/null 2>&1 \
    || nft add chain "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" \
      '{ type filter hook input priority filter - 5; policy accept; }'
  nft add rule "inet" "$LG_NFT_TABLE" "$LG_NFT_CHAIN" "${nft_args[@]}"
}

_lg_ufw_active() {
  command -v ufw >/dev/null 2>&1 || return 1
  ufw status 2>/dev/null | grep -qiE '^Status:\s*active'
}

_lg_ufw_rule_ok() {
  _lg_ufw_active || return 1
  ufw status 2>/dev/null | grep -qE "${LG_DASHBOARD_PORT}/tcp.*DENY"
}

_lg_ufw_rule_add() {
  _lg_ufw_active || return 1
  _lg_ufw_rule_ok && return 0
  local c
  for c in $(_lg_dashboard_allowed_cidrs); do
    ufw allow from "$c" to any port "$LG_DASHBOARD_PORT" proto tcp \
      comment 'log-guardian dashboard' >/dev/null 2>&1 || true
  done
  ufw --force deny "$LG_DASHBOARD_PORT"/tcp comment 'log-guardian dashboard block' >/dev/null 2>&1
}

lg_firewall_dashboard_bind_install() {
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

lg_firewall_dashboard_bind_check() {
  _lg_iptables_rule_ok && return 0
  _lg_nft_rule_ok && return 0
  _lg_ufw_rule_ok && return 0
  _lg_stamp_ok && return 0
  return 1
}

lg_firewall_dashboard_bind_method() {
  if _lg_iptables_rule_ok; then echo "iptables"; return 0; fi
  if _lg_nft_rule_ok; then echo "nftables"; return 0; fi
  if _lg_ufw_rule_ok; then echo "ufw"; return 0; fi
  if _lg_stamp_ok; then cat "$LG_FW_STAMP"; return 0; fi
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "${1:-install}" in
    install)
      if m=$(lg_firewall_dashboard_bind_install); then
        echo "[OK] firewall_dashboard_bind ($m) — port ${LG_DASHBOARD_PORT}"
      else
        echo "[FAIL] firewall_dashboard_bind — iptables/nftables/ufw basarisiz" >&2
        exit 1
      fi
      ;;
    check)
      if lg_firewall_dashboard_bind_check; then
        echo "[OK] firewall_dashboard_bind ($(lg_firewall_dashboard_bind_method)) — port ${LG_DASHBOARD_PORT}"
      else
        echo "[FAIL] firewall_dashboard_bind kurali yok" >&2
        exit 1
      fi
      ;;
    *)
      echo "Kullanim: $0 [install|check]" >&2
      exit 1
      ;;
  esac
fi
