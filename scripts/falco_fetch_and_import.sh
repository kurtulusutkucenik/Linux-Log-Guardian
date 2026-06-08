#!/usr/bin/env bash
# Falco CE kurallarini indir (opsiyonel) ve Guardian .lst uret
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VENDOR="${FALCO_RULES_DIR:-vendor/falco-rules}"
MIN_RULES="${FALCO_MIN_RULES:-50}"
OUT="${FALCO_OUT:-rules/generated-falco-host.json}"

count_rules() {
  python3 -c "import json; print(json.load(open('$OUT'))['count'])"
}

echo "=== falco_fetch_and_import ==="

python3 scripts/falco_import.py rules/falco/ -o "$OUT" --max 512 --verbose
local_n=$(count_rules)
echo "[OK] yerel: $local_n kural"

if [[ "$local_n" -ge "$MIN_RULES" ]]; then
  echo "[OK] hedef ($MIN_RULES+) yerel paketlerle saglandi"
  exit 0
fi

if [[ ! -d "$VENDOR/.git" ]] && command -v git >/dev/null 2>&1; then
  echo "[INFO] Falco CE clone: $VENDOR"
  mkdir -p "$(dirname "$VENDOR")"
  git clone --depth 1 https://github.com/falcosecurity/rules.git "$VENDOR" 2>/dev/null || true
fi

if [[ -d vendor/falco-rules/rules ]]; then
  python3 scripts/falco_import.py rules/falco/ vendor/falco-rules/rules \
    -o "$OUT" --max 512 --verbose || \
    python3 scripts/falco_import.py rules/falco/ -o "$OUT" --max 512 --verbose
  final_n=$(count_rules)
  echo "[OK] birlesik v2: $final_n guardian kurali"
  [[ "$final_n" -ge "$local_n" ]] || exit 1
else
  echo "[WARN] vendor/falco-rules yok — yerel $local_n kural (hedef: $MIN_RULES)"
fi
