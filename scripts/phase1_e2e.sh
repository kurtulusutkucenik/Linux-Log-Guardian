#!/usr/bin/env bash
# Faz 1 — CRS + ban pipeline + threat feed config + --status
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
make -s log-guardian

crs=$(grep -c '^CRS_REGEX=' rules/crs-bundle.rules 2>/dev/null || echo 0)
[[ "$crs" -ge 100 ]] || { echo "CRS bundle $crs < 100" >&2; exit 1; }
echo "[1] CRS bundle: $crs kural"

./log-guardian crs-stats --rules rules.conf 2>/dev/null | grep -q '"pcre_crs"'

grep -q '^BAN_TTL_SEC=' rules.conf
grep -q '^WAF_ENABLED=1' rules.conf
grep -qE '^MESH_BACKEND=(none|etcd|zmq)$' rules.conf

STATUS_RULES="rules.conf"
[[ -f /etc/log-guardian/rules.conf ]] && STATUS_RULES="/etc/log-guardian/rules.conf"
./log-guardian --status --rules "$STATUS_RULES" 2>/dev/null | grep -q '"ipc"'
echo "OK — phase1_e2e"
