#!/usr/bin/env bash
# FP_LEARN isinma — benign corpus ile fp-trust tabanini doldur (staging / laptop)
# Not: rules.conf ile ham replay WAF alarmi uretir (500/500) → FP EMA duser.
#      Varsayilan: warmup overlay (WAF kapali, FP_TRUST_DAYS=0).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LG_SHARE="/usr/local/share/log-guardian"
resolve_lg_bin() {
  if [[ -n "${LG_BIN:-}" && -x "$LG_BIN" ]]; then
    echo "$LG_BIN"
    return 0
  fi
  if [[ -x /usr/local/bin/log-guardian ]] \
      && strings /usr/local/bin/log-guardian 2>/dev/null | grep -qF LOG_GUARDIAN_SKIP_IPC; then
    echo /usr/local/bin/log-guardian
    return 0
  fi
  # Gelistirme agaci: yerel binary (deb oncesi veya upgrade sonrasi kaynak)
  if [[ -f "$ROOT/Makefile" || -f "$ROOT/main.c" ]]; then
    if [[ ! -x "$ROOT/log-guardian" ]]; then
      make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian 2>/dev/null || true
    fi
    if [[ -x "$ROOT/log-guardian" ]]; then
      echo "$ROOT/log-guardian"
      return 0
    fi
  fi
  if [[ -x /usr/local/bin/log-guardian ]]; then
    echo /usr/local/bin/log-guardian
    return 0
  fi
  echo "[fp_learn_warmup] log-guardian binary yok — make install veya LG_BIN=" >&2
  exit 1
}

BASE_RULES="${FP_RULES:-rules.conf}"
BENIGN="${FP_BENIGN:-corpus/benign_corpus.access}"
PASSES="${FP_WARMUP_PASSES:-1}"
MIN_TRUSTED="${FP_WARMUP_MIN_TRUSTED:-1}"
MIN_SAMPLES="${FP_WARMUP_MIN_SAMPLES:-${FP_TRUST_MIN_SAMPLES:-3}}"
WARMUP_TIMEOUT="${FP_WARMUP_TIMEOUT_SEC:-120}"
LG_CHILD=""
# Mutlak yol — overlay rules /tmp altindayken resolve_path yanlis dizine yazmasin
resolve_warmup_store() {
  if [[ -n "${FP_TRUST_STORE:-}" ]]; then
    echo "$FP_TRUST_STORE"
    return 0
  fi
  local d
  for d in "/var/lib/log-guardian" "$ROOT/data" "${TMPDIR:-/tmp}"; do
    if mkdir -p "$d" 2>/dev/null && [[ -w "$d" ]]; then
      echo "$d/fp-trust-warmup.lst"
      return 0
    fi
  done
  echo "/tmp/lg-fp-trust-warmup.lst"
}
WARMUP_STORE="$(resolve_warmup_store)"

if [[ ! -f "$BENIGN" && -f "$LG_SHARE/corpus/benign_corpus.access" ]]; then
  BENIGN="$LG_SHARE/corpus/benign_corpus.access"
fi
if [[ "$BENIGN" != /* ]]; then
  if [[ -f "$ROOT/$BENIGN" ]]; then
    BENIGN="$ROOT/$BENIGN"
  elif [[ -f "$LG_SHARE/$BENIGN" ]]; then
    BENIGN="$LG_SHARE/$BENIGN"
  fi
fi
if [[ ! -f "$BENIGN" ]] || [[ "$(wc -l < "$BENIGN" | tr -d ' ')" -lt 50 ]]; then
  if [[ -f "$ROOT/scripts/generate_benign_corpus.py" ]]; then
    python3 "$ROOT/scripts/generate_benign_corpus.py"
  elif [[ -f "$LG_SHARE/scripts/generate_benign_corpus.py" ]]; then
    (cd "$LG_SHARE" && python3 scripts/generate_benign_corpus.py)
  fi
fi
test -f "$BASE_RULES" || { echo "[fp_learn_warmup] rules yok: $BASE_RULES" >&2; exit 1; }

RULES=""
USE_OVERLAY=0
AUTH_LOG=""
PWFILE=""
kill_warmup_child() {
  if [[ -n "$LG_CHILD" ]] && kill -0 "$LG_CHILD" 2>/dev/null; then
    kill -TERM "$LG_CHILD" 2>/dev/null || true
    sleep 0.5
    kill -KILL "$LG_CHILD" 2>/dev/null || true
    wait "$LG_CHILD" 2>/dev/null || true
  fi
  LG_CHILD=""
}

cleanup() {
  kill_warmup_child
  if [[ -n "$RULES" && "$USE_OVERLAY" == "1" && -f "$RULES" ]]; then
    rm -f "$RULES"
  fi
  if [[ -n "$AUTH_LOG" && -f "$AUTH_LOG" ]]; then
    rm -f "$AUTH_LOG"
  fi
  if [[ -n "${PWFILE:-}" && -f "$PWFILE" ]]; then
    rm -f "$PWFILE"
  fi
  if [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
    rm -rf "$WORK_DIR"
  fi
  return 0
}

on_interrupt() {
  echo >&2
  echo "[fp_learn_warmup] kesildi — takildiysa: sudo pkill -f 'log-guardian.*benign_corpus'" >&2
  kill_warmup_child
  exit 130
}
trap cleanup EXIT
trap on_interrupt INT TERM

resolve_warmup_password() {
  if [[ "$(basename "$BASE_RULES")" == "test_rules.conf" ]]; then
    export LOGANALYZER_PASSWORD="DegistirBeni!123"
    return 0
  fi
  if [[ -n "${LOGANALYZER_PASSWORD:-}" ]]; then
    return 0
  fi
  if [[ -f /etc/log-guardian/env ]]; then
    local p
    p=$(grep -E '^LOGANALYZER_PASSWORD=' /etc/log-guardian/env 2>/dev/null | tail -1 | cut -d= -f2- || true)
    if [[ -n "$p" ]]; then
      export LOGANALYZER_PASSWORD="$p"
      return 0
    fi
  fi
  export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
}

resolve_warmup_password

if [[ "${FP_USE_RAW_RULES:-0}" == "1" ]] || [[ "$(basename "$BASE_RULES")" == "test_rules.conf" ]]; then
  USE_OVERLAY=1
  RULES=$(mktemp)
  {
    grep -vE '^(FP_TRUST_STORE|FP_TRUST_MIN_SAMPLES|WASM_ENABLED|MESH_|ETCD_)' "$BASE_RULES" \
      | grep -v '^[[:space:]]*#' || true
    cat <<EOF
WASM_ENABLED=0
MESH_PUB_ENABLED=0
MESH_SUB_ENABLED=0
WAF_ENABLED=0
CRS_ENABLED=0
THREAT_FEED_ENABLED=0
ADAPTIVE_THRESHOLD=0
FP_LEARN=1
FP_TRUST_DAYS=0
FP_TRUST_MIN_SAMPLES=$MIN_SAMPLES
FP_TRUST_STORE=$WARMUP_STORE
EOF
  } >"$RULES"
  echo "[fp_learn_warmup] rules=$BASE_RULES -> overlay (WAF kapali, min_samples=$MIN_SAMPLES)"
else
  USE_OVERLAY=1
  RULES=$(mktemp)
  mkdir -p data
  {
    grep -vE '^(FP_LEARN|FP_TRUST_|WAF_ENABLED|CRS_ENABLED|THREAT_FEED_ENABLED|METRICS_PORT|LOG_PATH|WEBHOOK_ENABLED|WASM_ENABLED|MESH_|ETCD_)' \
      "$BASE_RULES" | grep -v '^[[:space:]]*#' || true
    cat <<EOF
METRICS_PORT=0
LOG_PATH=/dev/null
WEBHOOK_ENABLED=0
WASM_ENABLED=0
MESH_PUB_ENABLED=0
MESH_SUB_ENABLED=0
WAF_ENABLED=0
CRS_ENABLED=0
THREAT_FEED_ENABLED=0
FP_LEARN=1
FP_TRUST_DAYS=0
FP_TRUST_MIN_SAMPLES=$MIN_SAMPLES
FP_TRUST_STORE=$WARMUP_STORE
EOF
  } >"$RULES"
  echo "[fp_learn_warmup] warmup overlay (base=$BASE_RULES, WAF kapali, FP_TRUST_DAYS=0)"
fi

mkdir -p "$(dirname "$WARMUP_STORE")"
if [[ "$(id -u)" -eq 0 ]]; then
  chown log-guardian:log-guardian "$(dirname "$WARMUP_STORE")" 2>/dev/null || true
  chmod 0750 "$(dirname "$WARMUP_STORE")" 2>/dev/null || true
fi
rm -f "$WARMUP_STORE"

WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"

LG_BIN=$(resolve_lg_bin)
echo "[fp_learn_warmup] binary=$LG_BIN"

echo "[fp_learn_warmup] corpus=$BENIGN passes=$PASSES min_samples=$MIN_SAMPLES timeout=${WARMUP_TIMEOUT}s"
export LOG_GUARDIAN_SKIP_IPC=1
AUTH_LOG=$(mktemp)
PWFILE=$(mktemp)
chmod 600 "$PWFILE"
printf '%s' "${LOGANALYZER_PASSWORD:-DegistirBeni!123}" >"$PWFILE"
for i in $(seq 1 "$PASSES"); do
  echo "  pass $i/$PASSES basliyor..."
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout --foreground "$WARMUP_TIMEOUT" "$LG_BIN" "$BENIGN" --no-tui --json --no-ban --no-db \
        --rules "$RULES" --password-file "$PWFILE" >"$AUTH_LOG" 2>&1
    ec=$?
    if [[ "$ec" -eq 124 ]]; then
      echo "[FAIL] pass $i timeout (${WARMUP_TIMEOUT}s) — servis yukunu kontrol edin" >&2
      tail -5 "$AUTH_LOG" >&2 || true
      exit 1
    fi
  else
    "$LG_BIN" "$BENIGN" --no-tui --json --no-ban --no-db --rules "$RULES" \
        --password-file "$PWFILE" >"$AUTH_LOG" 2>&1 &
    LG_CHILD=$!
    wait "$LG_CHILD"
    ec=$?
    LG_CHILD=""
  fi
  set -e
  if [[ "$ec" -eq 139 || "$ec" -eq 134 || "$ec" -eq 11 ]]; then
    if [[ -f fp-trust.json ]] && [[ -f "$WARMUP_STORE" ]] \
        && [[ "$(wc -l < "$WARMUP_STORE" | tr -d ' ')" -gt 0 ]]; then
      echo "[WARN] pass $i segfault (ec=$ec) ama FP store yazildi — devam" >&2
      ec=0
    else
      echo "[FAIL] log-guardian coktu (signal/segfault ec=$ec) — binary: $LG_BIN" >&2
      tail -5 "$AUTH_LOG" >&2 || true
      echo "  cozum: make -j\$(nproc) log-guardian && sudo bash scripts/upgrade_log_guardian_binary.sh" >&2
      exit 1
    fi
  fi
  if [[ "$ec" -ne 0 ]]; then
    if grep -q '\[ERISIM\]' "$AUTH_LOG" 2>/dev/null; then
      echo "[FAIL] parola/auth — LOGANALYZER_PASSWORD veya rules ACCESS_PASSWORD_KDF uyumsuz" >&2
      grep '\[ERISIM\]' "$AUTH_LOG" | tail -2 >&2 || true
      echo "  cozum: export LOGANALYZER_PASSWORD='...' bash scripts/fp_learn_warmup.sh" >&2
      exit 1
    fi
  fi
  echo "  pass $i/$PASSES"
done
AUTH_LOG=""

trusted=0
partial=0
samples=0
if [[ -f fp-trust.json ]]; then
  read -r trusted partial samples < <(python3 - <<'PY'
import json
from pathlib import Path
d = json.loads(Path("fp-trust.json").read_text())
print(d.get("trusted_ips", 0), d.get("partial_ips", 0), d.get("min_samples", 0))
PY
)
fi

store_lines=0
[[ -f "$WARMUP_STORE" ]] && store_lines=$(wc -l < "$WARMUP_STORE" | tr -d ' ')

echo "[fp_learn_warmup] trusted_ips=$trusted partial_ips=$partial store_lines=$store_lines"
test -f fp-trust.json && echo "  export: fp-trust.json"
[[ -f "$WARMUP_STORE" ]] && echo "  store: $WARMUP_STORE"

if [[ "$trusted" -ge "$MIN_TRUSTED" ]]; then
  if [[ ! -f "$WARMUP_STORE" || "$store_lines" -eq 0 ]]; then
    echo "[FAIL] trusted_ips=$trusted ama store bos: $WARMUP_STORE" >&2
    echo "  fp_trust_persist yazilmadi — log-guardian guncel mi? make && tekrar deneyin" >&2
    exit 1
  fi
  echo "[OK] FP isinma tamam — trusted_ips >= $MIN_TRUSTED"
  if [[ "$USE_OVERLAY" == "1" ]]; then
    echo "  prod:"
    echo "       sudo bash scripts/install_fp_trust_prod.sh \"$WARMUP_STORE\""
    echo "  not: prod FP_TRUST_DAYS=30 — tam guven 30 gun sonra (EMA onceden isinir)"
  fi
  exit 0
fi

echo "[FAIL] trusted_ips=$trusted — warmup basarisiz" >&2
if [[ "${FP_USE_RAW_RULES:-0}" == "1" ]] || [[ "$(basename "$BASE_RULES")" == "rules.conf" && "$USE_OVERLAY" == "0" ]]; then
  echo "  sebep: rules.conf WAF her satirda alarm → FP EMA duser" >&2
  echo "  cozum: FP_USE_RAW_RULES=0 (varsayilan overlay) veya FP_RULES=test_rules.conf" >&2
else
  echo "  FP_TRUST_MIN_SAMPLES=$MIN_SAMPLES veya FP_WARMUP_PASSES artirin" >&2
fi
exit 1
