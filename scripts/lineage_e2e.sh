#!/usr/bin/env bash
# Faz 2.1 — Lineage canli E2E (merge gate); demo opsiyonel preview
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/lineage_live_e2e.sh

API="${GUARDIAN_API_URL:-http://127.0.0.1:8080}"
if curl -sf --max-time 2 "${API}/api/v1/attack-tree" 2>/dev/null | grep -q '"trees"'; then
  echo "[lineage_e2e] analyzer API OK (${API})"
else
  echo "[lineage_e2e] analyzer API atlandi (daemon/TUI :8080)"
fi

echo "OK — lineage_e2e"
