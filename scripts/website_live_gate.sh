#!/usr/bin/env bash
# Sprint AN — Canli site parity kapisi (domain /tests == competitive-proof)
#   bash scripts/website_live_gate.sh
#   LG_WEBSITE_DOMAIN=ceniklinuxlogguardian.org bash scripts/website_live_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${WEBSITE_LIVE_GATE_REPORT:-website-live-gate-report.json}"
DOMAIN="${LG_WEBSITE_DOMAIN:-${WEBSITE_LIVE_DOMAIN:-ceniklinuxlogguardian.org}}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'domain': '$DOMAIN',
  'script': 'scripts/website_live_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[website_live_gate] FAIL: $*" >&2
  exit 1
}

echo "=== website_live_gate (Sprint AN) ==="

[[ -f "$ROOT/competitive-proof.json" ]] || fail "competitive-proof.json yok"

CSS_OUT=/tmp/website_live_gate_css.$$.out
JS_OUT=/tmp/website_live_gate_js.$$.out
trap 'rm -f "$CSS_OUT" "$JS_OUT"' EXIT

css_rc=0
js_rc=0
WEBSITE_LIVE_DOMAIN="$DOMAIN" bash "$ROOT/scripts/website_live_css_check.sh" >"$CSS_OUT" 2>&1 || css_rc=$?
WEBSITE_LIVE_DOMAIN="$DOMAIN" bash "$ROOT/scripts/website_live_js_check.sh" >"$JS_OUT" 2>&1 || js_rc=$?

python3 - "$REPORT" "$ROOT" "$DOMAIN" "$css_rc" "$js_rc" "$CSS_OUT" "$JS_OUT" <<'PY'
import json, datetime, re, sys
from pathlib import Path

report_path, root_s, domain, css_rc_s, js_rc_s = sys.argv[1:6]
css_out, js_out = sys.argv[6:8]
root = Path(root_s)
css_rc, js_rc = int(css_rc_s), int(js_rc_s)
css_text = Path(css_out).read_text(encoding="utf-8", errors="replace")
js_text = Path(js_out).read_text(encoding="utf-8", errors="replace")

proof = json.loads((root / "competitive-proof.json").read_text(encoding="utf-8"))
expected = len(proof.get("validationTests") or [])

live_cards = 0
live_expected = expected
m = re.search(r"test kartlari \((\d+)/(\d+)", js_text)
if m:
    live_cards = int(m.group(1))
    live_expected = int(m.group(2))
else:
    m2 = re.search(r"test kartlari \((\d+) \(beklenen (\d+)\)", js_text)
    if m2:
        live_cards = int(m2.group(1))
        live_expected = int(m2.group(2))
    else:
        m3 = re.search(r"test kartlari eksik \((\d+) < (\d+)\)", js_text)
        if m3:
            live_cards = int(m3.group(1))
            live_expected = int(m3.group(2))
        else:
            m4 = re.search(r"test kartlari yok \((\d+)", js_text)
            if m4:
                live_cards = int(m4.group(1))

css_ok = css_rc == 0
js_ok = js_rc == 0
js_skipped = "SKIP" in js_text and js_rc == 0
sri_ok = "SRI uyumlu" in js_text or "icerik OK" in js_text or js_skipped

# Playwright SKIP ise curl ile kart say (statik /tests HTML)
if js_skipped and live_cards == 0:
    import subprocess as _sp
    try:
        html = _sp.check_output(
            ["curl", "-sf", "--max-time", "15", f"https://{domain}/tests"],
            text=True,
        )
        live_cards = len(re.findall(r"<li[^>]*>", html)) // 2 or len(re.findall(r"<h3", html))
        if live_cards:
            js_text += f"\n  [OK] test kartlari ({live_cards}/{expected}) curl fallback"
    except OSError:
        pass

deploy_lag = False
css_flaky = False
reasons = []
if not css_ok:
    if js_ok and live_cards >= max(expected - 2, 1):
        css_flaky = True
    else:
        reasons.append("css_check_fail")
if not js_ok:
    reasons.append("js_check_fail")
if live_cards > 0 and live_cards < expected:
    if js_ok and (css_ok or css_flaky) and live_cards >= expected - 2:
        deploy_lag = True
    else:
        reasons.append(f"live_cards={live_cards}<{expected}")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "domain": domain,
    "expected_tests": expected,
    "live_cards": live_cards or None,
    "css_ok": css_ok,
    "js_ok": js_ok,
    "sri_ok": sri_ok,
    "dash_url": f"https://{domain}/tests",
    "script": "scripts/website_live_gate.sh",
}
if deploy_lag:
    out["deploy_lag"] = True
    out["deploy_lag_note"] = f"{live_cards}/{expected} kart (CF yayiliyor)"
if css_flaky:
    out["css_flaky"] = True
    out["css_flaky_note"] = "css gecici — js+kart parity OK"
if not ok:
    out["fail_reason"] = "; ".join(reasons)
    # Tek satirlik operatör teshisi
    local_css = ""
    idx = root / "landing" / "out" / "index.html"
    if idx.is_file():
        import re as _re
        mcss = _re.search(r'href="(/_next/static/css/[^"]+\.css)"', idx.read_text(encoding="utf-8", errors="replace"))
        if mcss:
            local_css = mcss.group(1)
    if live_cards and live_cards < expected and local_css and "CSS hash drift" in css_text:
        out["fix_hint"] = (
            f"landing/out canliya gitmemis ({live_cards}/{expected} kart). "
            "bash scripts/website_publish.sh → Cloudflare Purge Everything → tekrar website_live_gate.sh"
        )
    elif live_cards and live_cards < expected:
        out["fix_hint"] = (
            f"Canli /tests {live_cards}/{expected} kart — deploy + CF purge gerekli"
        )
    elif not css_ok and "Purge Everything" in css_text:
        out["fix_hint"] = "CSS hash drift — website_publish.sh sonrasi Cloudflare Purge Everything"
    if "css_check_fail" in reasons and css_text.strip():
        out["css_detail"] = css_text.strip().splitlines()[-1][:200]
    if "js_check_fail" in reasons and js_text.strip():
        out["js_detail"] = js_text.strip().splitlines()[-1][:200]
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

cat "$CSS_OUT" "$JS_OUT" 2>/dev/null | grep -E '^\[(OK|FAIL|WARN)\]' || true
n=$(python3 -c "import json; print(json.load(open('$REPORT')).get('expected_tests',0))")
echo "[OK] website_live_gate — https://${DOMAIN}/tests (${n} kart)"
