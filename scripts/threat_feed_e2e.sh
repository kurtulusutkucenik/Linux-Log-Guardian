#!/usr/bin/env bash
# Tier 2 #6 — threat feed: file URL + STIX → ban pipeline (offline)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LG_QUIET_BUILD=1 make -s log-guardian

CACHE="$ROOT/.cache"
mkdir -p "$CACHE" data

PLAIN="$CACHE/threat_feed_plain.txt"
STIX="$(readlink -f rules/sample-stix-bundle.json)"
RULES="$CACHE/threat_feed_e2e.conf"

cat > "$PLAIN" <<'EOF'
203.0.113.40
203.0.113.41
EOF

pwd_kdf="pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504"
cat > "$RULES" <<EOF
ACCESS_PASSWORD_KDF=${pwd_kdf}
THREAT_FEED_ENABLED=1
THREAT_FEED_SOURCES=url,stix
THREAT_FEED_URL=file://${PLAIN}
STIX_URL=file://${STIX}
THREAT_FEED_USE_BAN_PIPELINE=1
THREAT_FEED_MAX_IPS=100
THREAT_FEED_AUDIT=data/threat-feed-audit.jsonl
AUTO_BAN=0
DB_ENABLED=0
METRICS_PORT=0
WASM_ENABLED=0
EOF
chmod 600 "$RULES"

OUT=$(./log-guardian threat-feed-sync --rules "$RULES" --no-ban 2>/dev/null || true)
if [[ -z "$OUT" ]]; then
  echo "[FAIL] threat-feed-sync cikti yok" >&2
  exit 1
fi

applied=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['applied'])" "$OUT")
failed=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['failed'])" "$OUT")
total_iocs=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('total_iocs',0))" "$OUT")
if [[ "$applied" -lt 4 && "$total_iocs" -lt 4 ]]; then
  echo "[FAIL] applied=$applied failed=$failed total_iocs=$total_iocs (beklenen >=4 IoC)" >&2
  echo "$OUT"
  exit 1
fi

echo "[OK] threat_feed_e2e applied=$applied failed=$failed total_iocs=$total_iocs"
echo "$OUT"
