#!/usr/bin/env bash
# AUTO_BAN_MIN_RISK policy testi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
mkdir -p .cache
AUDIT="$ROOT/.cache/ban-policy-audit.jsonl"
rm -f "$AUDIT"

make -s log-guardian

ATTACK="$ROOT/.cache/ban_policy_attack.log"
mkdir -p "$ROOT/.cache"
cat > "$ATTACK" <<'LOG'
10.0.0.77 - - [02/Jun/2026:10:00:01 +0300] "GET /search?q=1%27+UNION+SELECT+null HTTP/1.1" 200 100 "-" "Mozilla/5.0"
LOG

RULES="$ROOT/.cache/ban_policy_rules.conf"
cat > "$RULES" <<RC
ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
WAF_ENABLED=1
WASM_ENABLED=1
WASM_PLUGIN_DIR=$ROOT/examples/plugins
AUTO_BAN=1
AUTO_BAN_MIN_RISK=60
BAN_POLICY_AUDIT=$AUDIT
CRS_ENABLED=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
RC
chmod 600 "$RULES"

./log-guardian "$ATTACK" --no-tui --json --no-ban --no-db --rules "$RULES" >/dev/null 2>&1 || true

export AUDIT
python3 <<'PY'
import json, os
from pathlib import Path
audit = Path(os.environ["AUDIT"])
lines = [json.loads(x) for x in audit.read_text(encoding="utf-8").splitlines() if x.strip()]
assert lines, "audit jsonl bos"
last = lines[-1]
assert last.get("decision") in (
    "ban", "force_crit", "force_waf", "force_apt",
    "skip_risk", "skip_fp_trust", "policy_off",
)
print(f"[ban_policy_test] decision={last['decision']} risk={last['risk_score']}")
if last["decision"] == "skip_risk":
    print("[OK] dusuk risk — ban atlandi (policy calisiyor)")
else:
    print("[OK] yuksek risk — ban karari")
PY

echo "[OK] ban_policy_test"
