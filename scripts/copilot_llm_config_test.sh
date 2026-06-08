#!/usr/bin/env bash
# Copilot — yalnızca Ollama + fallback
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "[copilot_llm_config_test] FAIL: $*" >&2; exit 1; }

test -f dashboard/src/lib/ollama.ts || fail "ollama.ts"
grep -q collectCopilotChat dashboard/src/lib/ollama.ts || fail "collectCopilotChat"
grep -q resolveCopilotOllamaConfig dashboard/src/lib/ollama.ts || fail "resolve"
test ! -f dashboard/src/lib/llmClient.ts || fail "llmClient.ts should be removed"
grep -q collectCopilotChat dashboard/src/app/api/copilot/route.ts || fail "route"
grep -q 'export async function GET' dashboard/src/app/api/copilot/route.ts || fail "GET /api/copilot"
grep -q COPILOT_OLLAMA_URL dashboard/.env.example || fail "env example"
grep -q 'isteğe bağlı\|optional' docs/COPILOT_LLM.md || fail "docs optional ollama"
! grep -qi gemini docs/COPILOT_LLM.md 2>/dev/null || fail "gemini removed from docs"
! grep -qi 'COPILOT_API_KEY' dashboard/.env.example 2>/dev/null || fail "cloud keys removed"

echo "[OK] copilot_llm_config_test"
