#!/usr/bin/env bash
# Derleme artıkları, eski binary'ler ve geçici raporları temizler.
# Kaynak kod, vendor, .cache/dashboard-live ve honeypot dosyalarına dokunmaz.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[clean] make clean (obj, binary, vmlinux.h, events.db)..."
make clean 2>/dev/null || true

echo "[clean] eski binary adları..."
rm -f loganalyzer loganalyzer-daemon siem_engine

echo "[clean] graphify-out..."
rm -rf graphify-out

echo "[clean] dashboard/.next (yeniden: npm run build --prefix dashboard)..."
rm -rf dashboard/.next

echo "[clean] eski analiz / test artıkları..."
rm -f analiz_ozet.txt analiz_sonucu.json test.txt
rm -f kurtulus.code-workspace 2>/dev/null || true

echo "[clean] kök dizin rapor kopyaları (.cache/dashboard-live kalır)..."
rm -f \
  bench-ban-latency.json bench-vs-modsec.json bench-report.txt \
  competitive-proof.json competitive-proof.pdf \
  compliance-report.json compliance-report.pdf \
  crs-parity-report.json fp-report.json fp-report.txt fp-trust.json \
  guardian-status.json tenant-isolation-report.json \
  copilot-rag-context.json attack_tree.json incidents-snapshot.json \
  soak-report.json soak-report.jsonl wasm-status.json

echo "[clean] .cache test logları (dashboard-live korunur)..."
find .cache -maxdepth 1 -type f \( -name '*.log' -o -name '*.conf' \) -delete 2>/dev/null || true
rm -rf .cache/lineage_live 2>/dev/null || true

echo "[clean] Tamam. Dashboard verisi: .cache/dashboard-live/"
ls -la .cache/dashboard-live/ 2>/dev/null || true
