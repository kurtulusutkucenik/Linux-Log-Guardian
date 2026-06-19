#!/usr/bin/env bash
# Makine muhtemelen internete acik mi? (VPS / public IP)
#   bash scripts/detect_internet_facing.sh && echo INTERNET_FACING=1
# Cikis: 0 = internet-facing, 1 = laptop/yerel
set -euo pipefail

is_private_ip() {
  local ip="${1%%/*}"
  [[ "$ip" =~ ^127\. ]] && return 0
  [[ "$ip" =~ ^10\. ]] && return 0
  [[ "$ip" =~ ^192\.168\. ]] && return 0
  [[ "$ip" =~ ^169\.254\. ]] && return 0
  [[ "$ip" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]] && return 0
  [[ "$ip" == "::1" ]] && return 0
  [[ "$ip" =~ ^fe80: ]] && return 0
  [[ "$ip" =~ ^fc00: ]] && return 0
  [[ "$ip" =~ ^fd ]] && return 0
  return 1
}

primary_ip=""
if command -v ip >/dev/null 2>&1; then
  primary_ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") print $(i+1)}' | head -1)
fi
if [[ -z "$primary_ip" ]]; then
  primary_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

[[ -z "$primary_ip" ]] && exit 1

if is_private_ip "$primary_ip"; then
  exit 1
fi

# CGNAT / ozel aralik disinda public IP
exit 0
