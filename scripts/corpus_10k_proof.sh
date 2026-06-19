#!/usr/bin/env bash
# Corpus 10K recall kaniti (rakip_kanit disinda — ~5-10 dk)
#   bash scripts/corpus_10k_proof.sh
#   REAL_ATTACK_CORPUS_LINES=10000 bash scripts/real_attack_suite.sh  # alternatif
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# Parola: log-guardian /etc/log-guardian/env'den yukler — replay_env fallback var
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

# LINES bash readonly (terminal satir sayisi) — CORPUS_TARGET kullan
CORPUS_TARGET="${REAL_ATTACK_CORPUS_LINES:-10000}"
CORPUS_MODE="${CORPUS_10K_MODE:-customer}"
REPORT="${CORPUS_10K_REPORT:-real-attack-report-10k.json}"
TIMEOUT="${REAL_ATTACK_REPLAY_TIMEOUT:-1200}"

echo "=== corpus_10k_proof ==="
echo "  mode=${CORPUS_MODE}  hedef=${CORPUS_TARGET} satir  timeout=${TIMEOUT}s"
echo "  hiz: WASM kapali overlay + REAL_ATTACK_SKIP_CATEGORIES=1"

# /etc KDF ozel ise parola env'den — sudo gerekir
if [[ -f /etc/log-guardian/rules.conf ]] && [[ "$(id -u)" -ne 0 ]]; then
  if ! grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$' \
      /etc/log-guardian/rules.conf 2>/dev/null; then
    echo "[INFO] ozel ACCESS_PASSWORD_KDF — sudo ile replay"
    exec sudo -E REAL_ATTACK_REPLAY_TIMEOUT="$TIMEOUT" REAL_ATTACK_SKIP_CATEGORIES=1 \
      LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" bash "$0" "$@"
  fi
fi
if [[ -f /etc/log-guardian/env ]] && [[ -r /etc/log-guardian/env ]]; then
  pw=$(grep -E '^LOGANALYZER_PASSWORD=' /etc/log-guardian/env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
  [[ -n "$pw" ]] && export LOGANALYZER_PASSWORD="$pw"
fi

[[ "${EUID:-$(id -u)}" -eq 0 ]] \
  || echo "[WARN] sudo onerilir — /etc/log-guardian/env parolasi okunamazsa replay basarisiz olabilir"

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

export REAL_ATTACK_REPLAY_TIMEOUT="$TIMEOUT"
export REAL_ATTACK_SKIP_CATEGORIES=1

if [[ "$CORPUS_MODE" == "customer" ]]; then
  python3 scripts/generate_customer_corpus.py
  CUSTOMER_10K_LINES="$CORPUS_TARGET" python3 scripts/generate_customer_10k_corpus.py
  export REAL_ATTACK_CORPUS="$ROOT/corpus/customer_10k.access"
  export REAL_ATTACK_MANIFEST="$ROOT/corpus/customer_10k_manifest.json"
  echo "[corpus_10k_proof] customer log_guardian expanded (honeypot degil)"
  echo "[INFO] offline replay — --no-ban --no-webhook (Telegram/ipset canli degil, recall olcumu)"
else
  export REAL_ATTACK_CORPUS_LINES="$CORPUS_TARGET"
  python3 scripts/generate_attack_corpus.py
  echo "[corpus_10k_proof] synthetic real_attack_corpus (legacy)"
fi

REAL_ATTACK_REPLAY_TIMEOUT="$TIMEOUT" python3 scripts/real_attack_replay.py -o "$REPORT"

python3 - "$REPORT" "$CORPUS_TARGET" <<'PY'
import json, sys
from pathlib import Path

report = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
target = int(sys.argv[2])
lines = report.get("lines_total", 0)
recall = report.get("attack_recall_pct", 0)
passed = report.get("pass", False)
print(f"[corpus_10k_proof] recall={recall}% lines={lines}/{target} pass={passed}")
if lines < target:
    raise SystemExit(f"corpus satir sayisi {lines} < {target}")
if not passed:
    raise SystemExit("recall hedefin altinda")
PY

cp -f "$REPORT" "${REPORT%.json}-snapshot.json" 2>/dev/null || true
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

# Varsayilan 1K synthetic corpus'a geri don (rakip_kanit hizli kalsin)
unset REAL_ATTACK_CORPUS REAL_ATTACK_MANIFEST
export REAL_ATTACK_CORPUS_LINES=1000
python3 scripts/generate_attack_corpus.py

echo "[OK] corpus_10k_proof -> $REPORT"
echo "       mode=${CORPUS_MODE} — varsayilan 1K synthetic corpus geri yuklendi"
