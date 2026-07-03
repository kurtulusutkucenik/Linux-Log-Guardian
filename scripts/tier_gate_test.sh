#!/usr/bin/env bash
# SaaS tier runtime gate — community Pro route'lari bloklar
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[tier_gate] FAIL: $*" >&2; exit 1; }

grep -q 'LOG_GUARDIAN_TIER' dashboard/src/lib/tier.ts || fail "tier.ts eksik"
grep -q 'isProRoute' dashboard/src/middleware.ts || fail "middleware tier gate eksik"
test -f dashboard/src/app/api/tier/route.ts || fail "api/tier eksik"
grep -q 'LOG_GUARDIAN_TIER' dashboard/.env.example || fail ".env.example tier yorumu eksik"

python3 - <<'PY'
import os
import importlib.util

# tier.ts mantigini Python ile dogrula (Node TS import gerektirmez)
TIER_ORDER = {"community": 0, "pro": 1, "pro_plus": 2, "enterprise": 3}

def normalize_tier(raw):
    s = raw.strip().lower().replace("-", "_")
    if s == "proplus":
        return "pro_plus"
    return s if s in TIER_ORDER else "community"

def resolve_tier():
    return normalize_tier(os.environ.get("LOG_GUARDIAN_TIER", "community"))

def tier_at_least(required):
    return TIER_ORDER[resolve_tier()] >= TIER_ORDER[required]

def is_pro_route(path):
    if path == "/fleet" or path.startswith("/fleet/"):
        return True
    if path.startswith("/api/fleet"):
        return True
    if path.startswith("/api/tenants/isolation"):
        return True
    if path == "/api/reports/export" or path.startswith("/api/reports/export/"):
        return True
    return False

os.environ["LOG_GUARDIAN_TIER"] = "community"
assert not tier_at_least("pro")
assert is_pro_route("/fleet")
assert is_pro_route("/api/reports/export")
assert not is_pro_route("/reports")
assert not is_pro_route("/api/reports")

os.environ["LOG_GUARDIAN_TIER"] = "pro"
assert tier_at_least("pro")
assert not tier_at_least("pro_plus")
assert not tier_at_least("enterprise")

os.environ["LOG_GUARDIAN_TIER"] = "pro-plus"
assert resolve_tier() == "pro_plus"
assert tier_at_least("pro")
assert tier_at_least("pro_plus")
assert not tier_at_least("enterprise")

os.environ["LOG_GUARDIAN_TIER"] = "pro_plus"
assert tier_at_least("pro_plus")
assert not tier_at_least("enterprise")

os.environ["LOG_GUARDIAN_TIER"] = "enterprise"
assert tier_at_least("enterprise")
print("[OK] tier gate logic")
PY

echo "[OK] tier_gate_test"
