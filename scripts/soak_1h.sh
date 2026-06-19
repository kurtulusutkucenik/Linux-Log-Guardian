#!/usr/bin/env bash
# 1 saatlik stabilite soak (72h scriptinin kisa modu)
#   bash scripts/soak_1h.sh
#   bash scripts/soak_1h.sh --start
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SOAK_1H=1
export SOAK_GRACE_SEC="${SOAK_GRACE_SEC:-60}"
exec bash "$ROOT/scripts/laptop_soak_72h.sh" "$@"
