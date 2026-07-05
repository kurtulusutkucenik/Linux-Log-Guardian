#!/usr/bin/env bash
# landing/ icinden de calisir — repo kokune gider
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" "$@"
