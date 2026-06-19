#!/usr/bin/env bash
# Sprint 1–3 laptop kapisi — VPS/GitHub gerekmez (VM 72h soak ayri)
#   bash scripts/laptop_sprint_gate.sh
#   SKIP_PHASE100=1 bash scripts/laptop_sprint_gate.sh   # hizli (~5 dk)
#   SKIP_DEB=1 bash scripts/laptop_sprint_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail_n=0
warn_n=0
ok_n=0

gate_ok()   { echo "[OK] $*"; ok_n=$((ok_n + 1)); }
gate_warn() { echo "[WARN] $*"; warn_n=$((warn_n + 1)); }
gate_fail() { echo "[FAIL] $*"; fail_n=$((fail_n + 1)); }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — laptop sprint gate (no VPS/GitHub) ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# --- Sprint 1: stabilize ---
echo "=== Sprint 1 — Stabilize ==="

if [[ -x "$ROOT/log-guardian" ]]; then
  gate_ok "binary ./log-guardian mevcut"
elif [[ -f "$ROOT/main.o" && ! -w "$ROOT/main.o" ]]; then
  gate_warn "root .o — calistir: bash scripts/fix_laptop_build.sh"
  gate_fail "make (izin)"
else
  echo "[build] make log-guardian..."
  make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon \
    && gate_ok "make log-guardian" || gate_fail "make log-guardian"
fi

if LG_SKIP_BUILD=1 bash scripts/security_hardening_test.sh >/dev/null 2>&1; then
  gate_ok "security_hardening_test"
else
  gate_fail "security_hardening_test"
fi

if bash scripts/local_security_audit.sh >/dev/null 2>&1; then
  gate_ok "local_security_audit (0 FAIL)"
else
  gate_fail "local_security_audit"
fi

if [[ "${SKIP_PHASE100:-0}" != "1" ]]; then
  if PHASE100_FAST=1 bash scripts/phase100.sh >/dev/null 2>&1; then
    gate_ok "phase100 (PHASE100_FAST)"
  else
    gate_warn "phase100 — tam kosu: bash scripts/phase100.sh"
  fi
else
  gate_warn "phase100 atlandi (SKIP_PHASE100=1)"
fi

if [[ "${SKIP_DEB:-0}" != "1" ]]; then
  if bash scripts/build_deb.sh >/dev/null 2>&1 && ls dist/log-guardian_*.deb >/dev/null 2>&1; then
    deb=$(ls -1 dist/log-guardian_*.deb | tail -1)
    gate_ok "build_deb -> $(basename "$deb")"
  else
    gate_fail "build_deb"
  fi
else
  gate_warn "build_deb atlandi (SKIP_DEB=1)"
fi

# --- Sprint 2: community security story ---
echo ""
echo "=== Sprint 2 — Community guvenlik ==="

for f in docs/SECURITY_PROFILES.md deploy/webhook.env.example examples/threat-feed.env.example; do
  [[ -f "$ROOT/$f" ]] && gate_ok "$f" || gate_fail "$f eksik"
done

grep -q 'internete açık\|internete acik\|laptop_harden' README.md 2>/dev/null \
  && gate_ok "README harden uyarisi" || gate_warn "README harden kutusu"

# --- Sprint 3: evidence ---
echo ""
echo "=== Sprint 3 — Kanit paketi ==="

if bash scripts/docs_consistency_check.sh >/dev/null 2>&1; then
  gate_ok "docs_consistency_check"
else
  gate_fail "docs_consistency_check"
fi

if bash scripts/sync_evidence_pack.sh >/dev/null 2>&1; then
  gate_ok "sync_evidence_pack -> docs/evidence/"
else
  gate_warn "sync_evidence_pack"
fi

if [[ -f competitive-proof.json ]]; then
  gate_ok "competitive-proof.json"
else
  gate_warn "competitive-proof.json yok — bash scripts/competitive_proof.sh"
fi

echo ""
echo "=== ozet ==="
echo "  OK: $ok_n   WARN: $warn_n   FAIL: $fail_n"
echo ""
if [[ "$fail_n" -eq 0 ]]; then
  echo "[OK] laptop_sprint_gate — Sprint 1-3 laptop kapisi gecti"
  echo "  Soak:  SOAK_1H=1 laptop 1 saat — bash scripts/soak_status.sh"
  echo "  Soak:  72h yalnizca VPS/VM — bash scripts/laptop_soak_72h.sh --start"
  echo "  Demo:  bash scripts/demo_3min.sh"
  echo "  Site:  bash scripts/website_deploy_gate.sh"
  exit 0
fi
echo "[FAIL] laptop_sprint_gate — $fail_n madde" >&2
exit 1
