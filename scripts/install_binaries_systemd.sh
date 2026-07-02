#!/usr/bin/env bash
# log-guardian + log-guardian-daemon kurulum (ETXTBSY onler)
#   sudo bash scripts/install_binaries_systemd.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT/scripts/upgrade_log_guardian_binary.sh" "$@"
