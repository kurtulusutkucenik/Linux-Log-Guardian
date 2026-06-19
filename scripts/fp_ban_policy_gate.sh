#!/usr/bin/env bash
# P3 #14 — FP trust + ban policy kapisi (VPS gerekmez)
#   bash scripts/fp_ban_policy_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== fp_ban_policy_gate ==="

bash "$ROOT/scripts/ban_policy_test.sh"
bash "$ROOT/scripts/fp_learn_warmup.sh"
bash "$ROOT/scripts/fp_cluster_trust_e2e.sh"

prod_fp=""
for p in /etc/log-guardian/data/fp-trust.lst /etc/log-guardian/fp-trust.lst; do
  [[ -f "$p" ]] && prod_fp="$p" && break
done
if [[ -n "$prod_fp" ]]; then
  lines=$(wc -l < "$prod_fp" | tr -d ' ')
  echo "[OK] prod fp-trust: $prod_fp ($lines satir)"
else
  echo "[INFO] prod fp-trust yok — isinma sonrasi:"
  echo "  bash scripts/fp_learn_warmup.sh"
  echo "  sudo bash scripts/install_fp_trust_prod.sh"
fi

echo "[OK] fp_ban_policy_gate — ban_policy + fp_trust + cluster trust"
