#!/usr/bin/env bash
# dashboard/ icinden: bash scripts/dashboard_stack.sh
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec bash "$ROOT/scripts/dashboard_stack.sh" "$@"
