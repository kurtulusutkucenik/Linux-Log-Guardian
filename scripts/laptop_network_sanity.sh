#!/usr/bin/env bash
# Laptop: gateway/DNS/LAN IP ipset'te mi? (INPUT DROP → internet kopar)
#   bash scripts/laptop_network_sanity.sh
#   bash scripts/laptop_network_sanity.sh --fix   # reserved banlari temizle
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IPSET="${IPSET_NAME:-log_analyzer_block_v4}"
FIX=0
[[ "${1:-}" == "--fix" ]] && FIX=1

fail=0
warn=0

ipset_run() {
  if [[ $EUID -eq 0 ]]; then
    ipset "$@"
  elif sudo -n ipset "$@" 2>/dev/null; then
    :
  else
    sudo ipset "$@"
  fi
}

ipset_has() {
  local ip="$1"
  ipset test "$IPSET" "$ip" >/dev/null 2>&1 \
    || sudo -n ipset test "$IPSET" "$ip" >/dev/null 2>&1 \
    || return 1
}

is_reserved_entry() {
  local ip="$1"
  [[ "$ip" == */* ]] || return 1
  case "$ip" in
    0.0.0.0/8|10.0.0.0/8|127.0.0.0/8|169.254.0.0/16|172.16.0.0/12|192.168.0.0/16)
      return 0 ;;
  esac
  return 1
}

purge_reserved_ipset() {
  local ip removed=0
  while IFS= read -r ip; do
    [[ -z "$ip" ]] && continue
    if is_reserved_entry "$ip" || [[ "$ip" == "$GW" || "$ip" == "$LAN" ]]; then
      ipset_run del "$IPSET" "$ip" -exist 2>/dev/null || true
      removed=$((removed + 1))
      echo "  -> ipset del: $ip"
    elif [[ "$ip" == */* ]] && [[ "$ip" != 203.0.113.* ]]; then
      # threat-intel CIDR kalintisi (test-net haric)
      ipset_run del "$IPSET" "$ip" -exist 2>/dev/null || true
      removed=$((removed + 1))
      echo "  -> ipset del (feed): $ip"
    fi
  done < <(list_ipset_members)
  [[ "$removed" -gt 0 ]] && echo "[OK] ipset reserved/feed temizligi: $removed kayit"
}

list_ipset_members() {
  if ipset list "$IPSET" -o plain >/dev/null 2>&1; then
    ipset list "$IPSET" -o plain 2>/dev/null
  elif sudo -n ipset list "$IPSET" -o plain >/dev/null 2>&1; then
    sudo -n ipset list "$IPSET" -o plain 2>/dev/null
  elif [[ $EUID -eq 0 ]]; then
    ipset list "$IPSET" -o plain 2>/dev/null || true
  else
    sudo ipset list "$IPSET" -o plain 2>/dev/null || true
  fi
}

say_fail() { echo "[FAIL] $*"; fail=$((fail + 1)); }
say_warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
say_ok()   { echo "[OK] $*"; }

echo "=== laptop_network_sanity ==="

GW="$(ip route show default 2>/dev/null | awk '/default/{print $3; exit}')"
LAN="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '/src/{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
LAN="${LAN:-$(hostname -I 2>/dev/null | awk '{print $1}')}"

mapfile -t DNS_IPS < <(
  awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null \
    | grep -E '^[0-9]+\.' | sort -u
)

check_critical() {
  local label="$1" ip="$2"
  [[ -z "$ip" ]] && return 0
  if ipset_has "$ip"; then
    say_fail "$label $ip ipset'te — DNS/DHCP DROP, internet kopar"
    if [[ "$FIX" -eq 1 ]]; then
      ipset_run del "$IPSET" "$ip" -exist 2>/dev/null || true
      "$ROOT/log-guardian" unban "$ip" >/dev/null 2>&1 \
        || sudo "$ROOT/log-guardian" unban "$ip" >/dev/null 2>&1 \
        || sudo log-guardian unban "$ip" >/dev/null 2>&1 || true
      echo "  -> unban denendi: $ip"
    fi
    return
  fi
  say_ok "$label $ip temiz"
}

check_critical "gateway" "$GW"
check_critical "LAN IP" "$LAN"
for d in "${DNS_IPS[@]:-}"; do
  [[ -n "$d" ]] && check_critical "DNS" "$d"
done

reserved_found=0
while IFS= read -r ip; do
  [[ -z "$ip" ]] && continue
  [[ "$ip" != *.* ]] && continue
  if is_reserved_entry "$ip"; then
    say_warn "reserved CIDR ipset'te: $ip (ag trafigi riski)"
    reserved_found=1
    [[ "$FIX" -eq 1 ]] && ipset_run del "$IPSET" "$ip" -exist 2>/dev/null || true
  fi
done < <(list_ipset_members | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(/[0-9]+)?$' || true)

[[ "$reserved_found" -eq 0 ]] && say_ok "ipset'te reserved/LAN CIDR yok"

if [[ "$FIX" -eq 1 ]]; then
  purge_reserved_ipset || true
fi

echo ""
echo "=== ozet ==="
echo "  FAIL: $fail   WARN: $warn"
if [[ "$fail" -gt 0 ]]; then
  echo ""
  echo "Onarim:"
  echo "  sudo bash scripts/laptop_network_sanity.sh --fix"
  echo "  FLUSH=1 bash scripts/laptop_ban_cleanup.sh"
  exit 1
fi
[[ "$warn" -gt 0 && "$FIX" -eq 0 ]] && echo "[INFO] WARN icin: sudo bash scripts/laptop_network_sanity.sh --fix"
exit 0
