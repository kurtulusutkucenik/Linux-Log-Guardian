#!/usr/bin/env bash
# Wrapper — asıl script repo kökünde. landing/ içinden de çalıştırılabilir.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/website_landing_export.sh" "$@"
