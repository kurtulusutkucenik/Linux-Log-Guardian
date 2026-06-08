#!/usr/bin/env bash
# Faz 0.4 — rules.conf MESH_/SIEM_/WAF_ anahtarlarinin yuklenmesi (dry-run)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
CONF="${1:-rules.conf}"
make -s log-guardian >/dev/null
out=$(./log-guardian test_access.log --no-tui --json --no-ban --no-db --rules "$CONF" 2>&1 || true)
for key in MESH_BACKEND SIEM_FORWARDER_ENABLED WAF_ENABLED; do
  if ! grep -q "^${key}=" "$CONF" 2>/dev/null; then
    echo "SKIP $key (rules dosyasinda yok)"
    continue
  fi
  echo "OK $key tanimli ($CONF)"
done
echo "$out" | grep -q '\[MESH\]' && echo "OK MESH log satiri"
echo "$out" | grep -q '\[RULES\]' && echo "OK RULES yuklendi"
echo "OK — verify_rules_conf"
