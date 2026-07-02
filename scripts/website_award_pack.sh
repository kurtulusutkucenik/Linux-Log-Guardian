#!/usr/bin/env bash
# Award / portfolio ZIP — deploy paketi sonrasi
#   bash scripts/website_award_pack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT/scripts/website_award_pack.py"
