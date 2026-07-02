#!/usr/bin/env bash
# Offline GeoIP MMDB (libmaxminddb) — MaxMind test DB ile probe
#   bash scripts/geoip_mmdb_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${ROOT}/geoip-mmdb-report.json"
MMDB="${GEOIP_MMDB:-}"
CACHE="${ROOT}/.cache/geoip-mmdb-test.mmdb"
TEST_IP="${GEOIP_MMDB_TEST_IP:-81.2.69.142}"
TEST_CC="${GEOIP_MMDB_TEST_CC:-GB}"
MMDB_URL="https://raw.githubusercontent.com/maxmind/MaxMind-DB/main/test-data/GeoIP2-Country-Test.mmdb"

fail() { echo "[geoip_mmdb_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== geoip_mmdb_e2e ==="

if ! grep -q 'geoip_lookup_load_mmdb' geoip_lookup.c; then
  fail "geoip_lookup_load_mmdb kaynakta yok"
fi
ok "MMDB loader kaynak"

HAVE_MMDB="$(make -s LG_QUIET_BUILD=1 print-maxminddb 2>/dev/null | tail -1 || echo 0)"
if [[ "$HAVE_MMDB" != "1" ]]; then
  python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "skip-no-lib",
    "have_maxminddb": False,
    "note": "libmaxminddb yok — MMDB opsiyonel; CSV offline calisir",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
  echo "[SKIP] libmaxminddb yok (HAVE_MAXMINDDB=0) — CSV offline yeterli"
  echo "[OK] geoip_mmdb_e2e (skip)"
  exit 0
fi

make -j"$(nproc)" geoip_lookup.o log-guardian >/dev/null || fail "derleme"

if [[ -z "$MMDB" ]]; then
  if [[ -f "$CACHE" ]]; then
    MMDB="$CACHE"
  else
    mkdir -p "$(dirname "$CACHE")"
    echo "[INFO] MaxMind test MMDB indiriliyor..."
    curl -sfL --max-time 30 "$MMDB_URL" -o "$CACHE" || fail "test MMDB indirilemedi ($MMDB_URL)"
    MMDB="$CACHE"
  fi
fi
[[ -f "$MMDB" ]] || fail "MMDB dosyasi yok: $MMDB"

probe="${ROOT}/.cache/geoip_mmdb_probe"
probe_c="${ROOT}/.cache/geoip_mmdb_probe.c"
CC_BIN="${CC:-clang}"
MMDB_LIBS="$(pkg-config --libs libmaxminddb 2>/dev/null || echo -lmaxminddb)"
cat > "$probe_c" <<EOF
#include "geoip_lookup.h"
#include <stdio.h>
#include <string.h>
int main(void) {
    geoip_lookup_set_enabled(1);
    if (geoip_lookup_load_mmdb("${MMDB}") != 0)
        return 2;
    if (strcmp(geoip_lookup_offline_backend(), "mmdb") != 0)
        return 3;
    char cc[8];
    if (!geoip_lookup_country("${TEST_IP}", cc, sizeof cc))
        return 4;
    if (strcmp(cc, "${TEST_CC}") != 0) {
        fprintf(stderr, "beklenen ${TEST_CC}, alinan %s\\n", cc);
        return 5;
    }
    return 0;
}
EOF
$CC_BIN -Wall -Wextra -O2 -pthread -I"$ROOT" \
  $(pkg-config --cflags libmaxminddb 2>/dev/null || true) \
  -DHAVE_MAXMINDDB \
  -o "$probe" "$probe_c" geoip_lookup.o $MMDB_LIBS -lcurl -pthread

rc=0
"$probe" || rc=$?
[[ "$rc" -eq 0 ]] || fail "MMDB probe rc=$rc (ip=${TEST_IP} cc=${TEST_CC})"
ok "MMDB lookup ${TEST_IP} -> ${TEST_CC}"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "mmdb-probe",
    "have_maxminddb": True,
    "mmdb": "${MMDB}",
    "test_ip": "${TEST_IP}",
    "test_cc": "${TEST_CC}",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "geoip_mmdb_e2e"
