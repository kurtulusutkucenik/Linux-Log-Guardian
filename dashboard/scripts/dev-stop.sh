#!/usr/bin/env bash
# Durdur: Cursor arka planinda acilan next dev (normal kill bazen "Erisim engellendi" verir)
set -euo pipefail
cd "$(dirname "$0")/.."

LOCK=".next/dev/lock"
if [[ -f "$LOCK" ]]; then
  PID=$(python3 -c "import json; print(json.load(open('$LOCK'))['pid'])" 2>/dev/null || true)
  PORT=$(python3 -c "import json; print(json.load(open('$LOCK'))['port'])" 2>/dev/null || echo "3000")
  echo "Lock: PID=${PID:-?} port=${PORT:-3000}"
else
  PID=""
  PORT=3000
  echo "Lock dosyasi yok; port $PORT dinleyen surec araniyor..."
fi

if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
  echo "kill $PID deneniyor..."
  if kill "$PID" 2>/dev/null; then
    sleep 1
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  else
    echo "Normal kill basarisiz (Cursor sandbox). sudo ile deneyin:"
    echo "  sudo kill -9 $PID"
    PPID=$(ps -p "$PID" -o ppid= 2>/dev/null | tr -d ' ' || true)
    if [[ -n "${PPID:-}" && "$PPID" != "1" ]]; then
      echo "  sudo kill -9 $PPID $PID"
    fi
    exit 1
  fi
fi

# Port uzerinden kalan surec
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi

rm -f "$LOCK" 2>/dev/null || true
echo "Tamam. Simdi: npm run dev"
