#!/usr/bin/env bash
# Ollama'yi Docker dashboard'dan erisilebilir yap (Linux: varsayilan 127.0.0.1:11434).
set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
  echo "[ollama_docker] ollama kurulu degil — atlaniyor." >&2
  exit 0
fi

DROP_IN="/etc/systemd/system/ollama.service.d/override.conf"
echo "[ollama_docker] OLLAMA_HOST=0.0.0.0:11434 ayarlaniyor (sudo gerekir)..."

sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee "$DROP_IN" >/dev/null <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

sudo systemctl daemon-reload
sudo systemctl restart ollama 2>/dev/null || {
  echo "[ollama_docker] systemd ollama yok — elle baslatin:"
  echo "  OLLAMA_HOST=0.0.0.0:11434 ollama serve"
  exit 0
}

sleep 2
if ss -tlnp 2>/dev/null | grep -qE '(\*:11434|0\.0\.0\.0:11434|\[::\]:11434)'; then
  echo "[ollama_docker] OK — Ollama dis erisim icin dinliyor (*:11434)."
  echo "Dashboard /copilot sayfasini yenileyin; yesil nokta = dogal dil modu."
else
  echo "[ollama_docker] UYARI: 11434 portu acik gorunmuyor; ollama servis loglarini kontrol edin." >&2
  echo "  journalctl -u ollama -n 20 --no-pager" >&2
  exit 1
fi
