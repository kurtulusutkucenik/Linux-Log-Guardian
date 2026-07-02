#!/usr/bin/env bash
# Statik export önizleme — landing/ içinden çalıştır.
set -euo pipefail
LANDING="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$LANDING/out"
PORT="${PORT:-4321}"
RESTART=0

for arg in "$@"; do
  case "$arg" in
    --restart|-r) RESTART=1 ;;
    [0-9]*) PORT="$arg" ;;
  esac
done

if [[ ! -d "$OUT" ]]; then
  echo "[FAIL] $OUT yok — önce build al:" >&2
  echo "  bash scripts/website_landing_export.sh" >&2
  exit 1
fi

port_pid() {
  ss -tlnp 2>/dev/null | grep -E ":${PORT}\\s" | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1
}

PID="$(port_pid || true)"
if [[ -n "$PID" ]]; then
  if [[ "$RESTART" -eq 1 ]]; then
    echo "[preview] Port ${PORT} meşgul (pid ${PID}) — yeniden başlatılıyor..."
    kill "$PID" 2>/dev/null || true
    sleep 0.5
    PID="$(port_pid || true)"
    if [[ -n "$PID" ]]; then
      echo "[FAIL] Port ${PORT} hâlâ meşgul. Elle durdur: kill ${PID}" >&2
      exit 1
    fi
  else
    echo "=== landing preview (zaten çalışıyor) ==="
    echo "  URL: http://localhost:${PORT}"
    echo "  pid: ${PID}"
    echo ""
    echo "  Yeniden başlatmak için: bash scripts/preview.sh --restart"
    echo "  Farklı port:           bash scripts/preview.sh 4322"
    exit 0
  fi
fi

cd "$OUT"
echo "=== landing preview ==="
echo "  URL: http://localhost:${PORT}"
echo "  Durdur: Ctrl+C"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
