#!/usr/bin/env bash
# 5 dakikalik stabilite soak (on planda — 1 saat arka plan degil)
#   bash scripts/soak_5m.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SOAK_SHORT=1
exec bash "$ROOT/scripts/soak_test.sh"
