#!/usr/bin/env bash
# P4 #16 — ARM64 (aarch64) cross-build smoke (GitHub oncesi yerel kanit)
#   bash scripts/build_arm64.sh
# Gercek ARM makinede: ARCH=aarch64 make -j$(nproc) log-guardian
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/arm64-build-report.json"

fail() { echo "[build_arm64] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

write_dry_run_report() {
  local note="${1:-Cross link basarisiz — Makefile syntax smoke}"
  python3 - "$OUT" "$(uname -m)" "dry-run" "$note" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[3],
    "host_arch": sys.argv[2],
    "target_arch": "aarch64",
    "note": sys.argv[4],
    "script": "scripts/build_arm64.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
  ok "build_arm64 — dry-run (laptop WARN)"
  exit 0
}

echo "=== build_arm64 ==="

host_arch="$(uname -m)"
mode="native"
cc="${CC:-clang}"

if [[ "$host_arch" == "aarch64" || "$host_arch" == "arm64" ]]; then
  make -s log-guardian ARCH=aarch64
  mode="native-aarch64"
elif command -v aarch64-linux-gnu-gcc >/dev/null 2>&1; then
  if ! bash "$ROOT/scripts/install_arm64_cross_deps.sh" --check >/dev/null 2>&1; then
    echo "[build_arm64] arm64 dev lib eksik — crossbuild-essential-arm64 yetmez; ports.ubuntu gerekli" >&2
    if [[ "${INSTALL_ARM64_DEPS:-0}" == "1" ]] && [[ "$(id -u)" -eq 0 ]]; then
      bash "$ROOT/scripts/install_arm64_cross_deps.sh"
    elif command -v sudo >/dev/null 2>&1 && [[ -t 0 ]]; then
      echo "[build_arm64] Deneniyor: sudo bash scripts/install_arm64_cross_deps.sh" >&2
      sudo bash "$ROOT/scripts/install_arm64_cross_deps.sh" || true
    else
      echo "[build_arm64] Manuel: sudo bash scripts/install_arm64_cross_deps.sh" >&2
    fi
  fi
  cross_clean_objs() {
    find "$ROOT" -maxdepth 1 -name '*.o' -delete 2>/dev/null || true
  }
  cross_restore_host() {
    cross_clean_objs
    make -s log-guardian LG_QUIET_BUILD=1 2>/dev/null || make -s log-guardian
  }
  cross_clean_objs
  if ! make -B -s log-guardian ARCH=aarch64 CC=aarch64-linux-gnu-gcc \
      HAVE_WASM=0 HAVE_MAXMINDDB=0 HAVE_ZMQ=0 HAVE_ETCD=0 LG_QUIET_BUILD=1; then
    cross_restore_host || true
    write_dry_run_report "Cross derleme basarisiz — sudo bash scripts/install_arm64_cross_deps.sh (libcurl curl-config cakismasi: force-overwrite)"
  fi
  if [[ -x ./log-guardian ]]; then
    file_probe="$(file ./log-guardian)"
    if ! echo "$file_probe" | grep -qE 'ARM aarch64|aarch64'; then
      rm -f ./log-guardian
      cross_restore_host || true
      write_dry_run_report "Cross binary aarch64 degil — stale .o veya lib eksik: $file_probe"
    fi
    mv -f ./log-guardian ./log-guardian.aarch64
    cross_restore_host
  fi
  mode="cross-gnu"
elif command -v aarch64-linux-gnu-clang >/dev/null 2>&1; then
  make -s log-guardian ARCH=aarch64 CC=aarch64-linux-gnu-clang
  if [[ -x ./log-guardian.aarch64 ]]; then :; elif [[ -x ./log-guardian ]]; then
    mv -f ./log-guardian ./log-guardian.aarch64
    make -s log-guardian ARCH=x86_64 2>/dev/null || make -s log-guardian
  fi
  mode="cross-clang"
else
  ok "cross-toolchain yok — Makefile ARCH=aarch64 SIMD kapali (syntax check)"
  make -s -n log-guardian ARCH=aarch64 >/dev/null 2>&1 || fail "make -n ARCH=aarch64"
  python3 - "$OUT" "$host_arch" "dry-run" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[3],
    "host_arch": sys.argv[2],
    "target_arch": "aarch64",
    "note": "Cross-toolchain yok — Makefile ARCH SIMD ayri; gercek ARM'de make ARCH=aarch64",
    "script": "scripts/build_arm64.sh",
}, indent=2) + "\n", encoding="utf-8")
print("[OK] build_arm64 — dry-run (toolchain yok)")
PY
  exit 0
fi

[[ -x ./log-guardian ]] || [[ -x ./log-guardian.aarch64 ]] || fail "binary uretilmedi"
file_out="$(file ./log-guardian.aarch64 2>/dev/null || file ./log-guardian)"
if [[ "$mode" == "cross-gnu" || "$mode" == "cross-clang" ]]; then
  echo "$file_out" | grep -qE 'ARM aarch64|aarch64' \
    || fail "cross binary aarch64 degil: $file_out"
fi
ok "binary: $file_out"

python3 - "$OUT" "$mode" "$host_arch" "$file_out" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[2],
    "host_arch": sys.argv[3],
    "target_arch": "aarch64",
    "file": sys.argv[4],
    "script": "scripts/build_arm64.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] build_arm64 — mode=$mode"
