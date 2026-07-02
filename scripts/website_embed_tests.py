#!/usr/bin/env python3
"""competitive-proof.json -> test-results.js + tests.html statik kartlar (JS/SRI kirilinca)."""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "competitive-proof.json"
OUT = ROOT / "assets/website/test-results.js"
SITE = ROOT / "assets/website"
TESTS_HTML = SITE / "tests.html"
TESTS_RE = re.compile(r"var tests = \[.*?\];", re.DOTALL)
STATIC_RE = re.compile(
    r"<!-- LG_TESTS_STATIC -->.*?<!-- LG_TESTS_STATIC_END -->",
    re.DOTALL,
)
HERO_RE = re.compile(
    r"<!-- LG_TESTS_HERO -->.*?<!-- LG_TESTS_HERO_END -->",
    re.DOTALL,
)
SUMMARY_RE = re.compile(
    r"<!-- LG_TESTS_SUMMARY -->.*?<!-- LG_TESTS_SUMMARY_END -->",
    re.DOTALL,
)
TOOLBAR_RE = re.compile(
    r"<!-- LG_TESTS_TOOLBAR -->.*?<!-- LG_TESTS_TOOLBAR_END -->",
    re.DOTALL,
)
COUNT_TR = re.compile(r"(\d+)\s+kanıt")
COUNT_EN = re.compile(r"(\d+)\s+proofs")
OPEN_TR = re.compile(r"Tüm testleri gör\s*\((\d+)\)")
OPEN_EN = re.compile(r"View all tests\s*\((\d+)\)")
META_TR = re.compile(r"doğrulama testleri\s*\((\d+)\s+otomatik kanıt\)")
MARQUEE_TR = re.compile(r"·\s*\d+\s+test\s*·")
MARQUEE_EN = re.compile(r"·\s*\d+\s+tests\s*·")
WHY_TR = re.compile(r",\s*\d+\s+test,")
WHY_EN = re.compile(r",\s*\d+\s+tests,")
PROOF_TITLE = re.compile(r'Proof="(\d+)\s+tests?"')
PROOF_TAG = re.compile(r"^(\d+)\s+tests?$")
HERO_COUNT = re.compile(
    r'(<span class="lg-hero-metric-val" data-lg-count=")\d+(">)[^<]*('
    r'</span>\s*<span class="lg-hero-metric-label" data-i18n="hero\.metric_tests")'
)
STATS_COUNT = re.compile(
    r'(<span class="lg-stat-value"><span data-lg-count=")\d+(">)[^<]*('
    r'</span></span>\s*<span class="lg-stat-label" data-i18n="stats\.tests_label")'
)
PROOF_META = re.compile(r'<meta name="lg-proof-stats" content="[^"]*" />')

GROUP_TR = {
    "gate": "Kurulum ve güvenlik kapıları",
    "proof": "Rekabet ve güvenlik kanıtı",
}
STATUS_TR = {"pass": "GEÇTİ", "fail": "KALDI", "warn": "UYARI", "pending": "BEKLİYOR"}


def pick(item: dict, key: str, lang: str = "tr") -> str:
    if lang == "en":
        en = item.get(key + "En") or item.get(key) or ""
        return str(en)
    return str(item.get(key) or "")


def card_html(item: dict) -> str:
    st = item.get("status") or "pending"
    if st not in ("pass", "fail", "warn", "pending"):
        st = "pending"
    title = html.escape(pick(item, "title", "tr"))
    purpose = pick(item, "purpose", "tr")
    verdict = html.escape(pick(item, "verdict", "tr"))
    label = STATUS_TR.get(st, st.upper())
    parts = [
        f'<li class="test-card status-{st} test-card-static" id="test-{html.escape(str(item.get("id", "")))}" data-test-id="{html.escape(str(item.get("id", "")))}">',
        '<div class="test-card-head">',
        '<div class="test-card-head-main">',
        '<span class="test-card-icon" aria-hidden="true"></span>',
        '<div class="test-card-title-wrap">',
        f"<h3>{title}</h3>",
    ]
    if purpose:
        parts.append(f'<p class="test-purpose">{html.escape(purpose)}</p>')
    parts.extend(
        [
            "</div></div>",
            f'<span class="test-status">{html.escape(label)}</span>',
            "</div>",
            f'<p class="test-verdict-box">{verdict}</p>',
        ]
    )
    metrics = item.get("metrics") or []
    if metrics:
        parts.append('<div class="test-metrics">')
        for m in metrics:
            lbl = html.escape(str(m.get("label", "")))
            val = html.escape(str(m.get("value", "")))
            parts.append(
                f'<span class="test-metric">'
                f'<span class="test-metric-label">{lbl}:</span> {val}</span>'
            )
        parts.append("</div>")
    script = item.get("script") or ""
    date = item.get("date") or ""
    if script or date:
        parts.append('<div class="test-card-foot">')
        if script:
            parts.append(f"<span>{html.escape(str(script))}</span>")
        if date:
            parts.append(f"<time datetime=\"{html.escape(str(date))}\">{html.escape(str(date))}</time>")
        parts.append("</div>")
    parts.append("</li>")
    return "\n".join(parts)


def static_blocks(tests: list[dict]) -> tuple[str, str, str, str]:
    total = len(tests)
    passed = sum(1 for t in tests if t.get("status") == "pass")
    failed = sum(1 for t in tests if t.get("status") == "fail")
    warned = sum(1 for t in tests if t.get("status") == "warn")
    pct = round((passed / total) * 100) if total else 0
    all_pass = failed == 0 and passed == total and total > 0
    hero_title = "Tüm testler geçti" if all_pass else "Test özeti"
    summary = f"{passed}/{total} test geçti"
    if failed:
        summary += f" · {failed} kaldı"
    if warned:
        summary += f" · {warned} uyarı"

    hero_class = "test-hero" + (" lg-test-hero-perfect" if all_pass else "")
    hero = "\n".join(
        [
            "<!-- LG_TESTS_HERO -->",
            f'<div id="test-results-hero" class="{hero_class}" aria-live="polite">',
            f'<div class="test-hero-badge" aria-hidden="true">{pct}%</div>',
            '<div class="test-hero-text">',
            f"<strong>{html.escape(hero_title)}</strong>",
            f"<span>{html.escape(summary)}</span>",
            "</div>",
            '<div class="test-hero-bar" aria-hidden="true">',
            f'<progress class="test-hero-bar-fill" value="{pct}" max="100"></progress>',
            "</div>",
            "</div>",
            "<!-- LG_TESTS_HERO_END -->",
        ]
    )

    summary_block = "\n".join(
        [
            "<!-- LG_TESTS_SUMMARY -->",
            f'<p id="test-results-summary" class="test-summary muted-sm">{html.escape(summary)}</p>',
            "<!-- LG_TESTS_SUMMARY_END -->",
        ]
    )

    cards: list[str] = ["<!-- LG_TESTS_STATIC -->"]
    last_group = ""
    for item in tests:
        group = str(item.get("group") or "proof")
        if group != last_group:
            last_group = group
            glabel = html.escape(GROUP_TR.get(group, group))
            cards.append(f'<li class="test-group-label">{glabel}</li>')
        cards.append(card_html(item))
    cards.append("<!-- LG_TESTS_STATIC_END -->")
    static = "\n".join(cards)

    toolbar_parts = [
        "<!-- LG_TESTS_TOOLBAR -->",
        '<div id="test-results-toolbar" class="tests-toolbar" aria-live="polite">',
        '<div class="tests-toolbar-pill">',
        f"<span>{total} test</span>",
        f'<span class="tests-toolbar-pass">{passed} geçti</span>',
    ]
    if warned:
        toolbar_parts.append(f'<span class="tests-toolbar-warn">{warned} ⚠</span>')
    if failed:
        toolbar_parts.append(f'<span class="tests-toolbar-fail">{failed} ✗</span>')
    toolbar_parts.extend(
        [
            "</div>",
            '<a class="tests-toolbar-pdf" href="/evidence/competitive-proof.pdf" '
            'rel="noopener noreferrer" type="application/pdf" data-i18n="tests.proof_pdf">Kanıt PDF</a>',
            '<a class="tests-toolbar-pack" href="/evidence/competitive-proof.json" '
            'rel="noopener noreferrer" download data-i18n="tests.proof_pack">Kanıt paketi JSON</a>',
            "</div>",
            "<!-- LG_TESTS_TOOLBAR_END -->",
        ]
    )
    toolbar = "\n".join(toolbar_parts)

    return hero, summary_block, static, toolbar


def patch_tests_html(tests: list[dict]) -> None:
    if not TESTS_HTML.is_file():
        return
    hero, summary, static, toolbar = static_blocks(tests)
    raw = TESTS_HTML.read_text(encoding="utf-8")
    if "<!-- LG_TESTS_HERO -->" not in raw:
        print("[website_embed_tests] WARN: tests.html marker eksik — statik kart atlandi", file=sys.stderr)
        return
    raw = HERO_RE.sub(hero, raw, count=1)
    raw = SUMMARY_RE.sub(summary, raw, count=1)
    if "<!-- LG_TESTS_TOOLBAR -->" in raw:
        raw = TOOLBAR_RE.sub(toolbar, raw, count=1)
    raw = STATIC_RE.sub(static, raw, count=1)
    TESTS_HTML.write_text(raw, encoding="utf-8")


def update_test_counts(tests: list[dict]) -> None:
    total = len(tests)
    passed = sum(1 for t in tests if t.get("status") == "pass")
    failed = sum(1 for t in tests if t.get("status") == "fail")

    for loc in (SITE / "locales").glob("*.json"):
        raw = loc.read_text(encoding="utf-8")
        data = json.loads(raw)
        lang = loc.stem
        teaser = data.get("tests.teaser", "")
        if "kanıt" in teaser:
            data["tests.teaser"] = COUNT_TR.sub(f"{total} kanıt", teaser, count=1)
        elif "proofs" in teaser:
            data["tests.teaser"] = COUNT_EN.sub(f"{total} proofs", teaser, count=1)
        open_full = data.get("tests.open_full", "")
        if "Tüm testleri" in open_full:
            data["tests.open_full"] = OPEN_TR.sub(f"Tüm testleri gör ({total})", open_full, count=1)
        elif "View all tests" in open_full:
            data["tests.open_full"] = OPEN_EN.sub(f"View all tests ({total})", open_full, count=1)
        data["tests.hl_pass_value"] = f"{passed}/{total}"
        marquee = data.get("marquee.line", "")
        if lang == "tr":
            data["marquee.line"] = MARQUEE_TR.sub(f"· {passed} test ·", marquee, count=1)
            why = data.get("why.c2_body", "")
            data["why.c2_body"] = WHY_TR.sub(f", {passed} test,", why, count=1)
            for key in ("showcase.proof.title",):
                if key in data:
                    data[key] = PROOF_TITLE.sub(f'Proof="{passed} test"', data[key], count=1)
            for key in ("showcase.proof.tag1", "showcase.proof.peek"):
                if key in data and PROOF_TAG.match(data[key].split(" ·")[0].strip()):
                    rest = data[key].split(" ·", 1)
                    tail = f" · {rest[1]}" if len(rest) > 1 else ""
                    data[key] = f"{passed} test{tail}"
        else:
            data["marquee.line"] = MARQUEE_EN.sub(f"· {passed} tests ·", marquee, count=1)
            why = data.get("why.c2_body", "")
            data["why.c2_body"] = WHY_EN.sub(f", {passed} tests,", why, count=1)
            for key in ("showcase.proof.title",):
                if key in data:
                    data[key] = PROOF_TITLE.sub(f'Proof="{passed} tests"', data[key], count=1)
            for key in ("showcase.proof.tag1", "showcase.proof.peek"):
                if key in data:
                    head = data[key].split(" ·")[0].strip()
                    if PROOF_TAG.match(head) or head.replace(" tests", "").isdigit():
                        rest = data[key].split(" ·", 1)
                        tail = f" · {rest[1]}" if len(rest) > 1 else ""
                        data[key] = f"{passed} tests{tail}"
        loc.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    idx = SITE / "index.html"
    if idx.is_file():
        html_txt = idx.read_text(encoding="utf-8")
        html_txt = COUNT_TR.sub(f"{total} kanıt", html_txt)
        html_txt = HERO_COUNT.sub(rf"\g<1>{passed}\g<2>{passed}\g<3>", html_txt, count=1)
        html_txt = STATS_COUNT.sub(rf"\g<1>{passed}\g<2>{passed}\g<3>", html_txt, count=1)
        meta = f'<meta name="lg-proof-stats" content="{total},{passed},{failed}" />'
        if PROOF_META.search(html_txt):
            html_txt = PROOF_META.sub(meta, html_txt, count=1)
        else:
            html_txt = html_txt.replace(
                '<meta name="referrer"',
                meta + "\n  " + '<meta name="referrer"',
                1,
            )
        idx.write_text(html_txt, encoding="utf-8")

    if TESTS_HTML.is_file():
        html_txt = TESTS_HTML.read_text(encoding="utf-8")
        html_txt = META_TR.sub(f"doğrulama testleri ({total} otomatik kanıt)", html_txt)
        TESTS_HTML.write_text(html_txt, encoding="utf-8")


def main() -> int:
    if not PROOF.is_file():
        print(f"[website_embed_tests] FAIL: {PROOF} yok", file=sys.stderr)
        return 1
    if not OUT.is_file():
        print(f"[website_embed_tests] FAIL: {OUT} yok", file=sys.stderr)
        return 1

    data = json.loads(PROOF.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    # id bazli tekillestir (competitive_proof oncesi eski json)
    seen: set[str] = set()
    uniq: list[dict] = []
    for t in tests:
        tid = str(t.get("id") or "")
        if tid and tid in seen:
            continue
        if tid:
            seen.add(tid)
        uniq.append(t)
    tests = uniq
    blob = json.dumps(tests, ensure_ascii=False, separators=(",", ":"))
    replacement = f"var tests = {blob};"

    raw = OUT.read_text(encoding="utf-8")
    if not TESTS_RE.search(raw):
        print("[website_embed_tests] FAIL: var tests = [...] bulunamadi", file=sys.stderr)
        return 1
    OUT.write_text(TESTS_RE.sub(replacement, raw, count=1), encoding="utf-8")
    patch_tests_html(tests)
    update_test_counts(tests)
    print(f"[OK] website_embed_tests -> {len(tests)} test (+ statik HTML)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
