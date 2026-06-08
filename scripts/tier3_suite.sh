#!/usr/bin/env bash
# Tier 3 — Copilot RAG, Marketplace, K8s admission, eBPF L7
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== tier3_suite ==="

echo "--- [P1] Copilot RAG ---"
bash scripts/copilot_rag_test.sh

echo "--- [P1b] Copilot LLM config ---"
bash scripts/copilot_llm_config_test.sh

echo "--- [P2] Rules marketplace ---"
bash scripts/marketplace_test.sh

echo "--- [P3] K8s admission ---"
bash scripts/k8s_admission_test.sh

echo "--- [P4] eBPF L7 ---"
bash scripts/l7_ebpf_test.sh

echo "[OK] tier3_suite"
