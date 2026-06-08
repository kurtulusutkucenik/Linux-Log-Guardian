#!/usr/bin/env python3
"""competitive-proof.json -> acik kaynak kanit PDF (TR veya EN)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

LOCALE = "tr"

STRINGS: dict[str, dict[str, str]] = {
    "tr": {
        "footer": "GIZLI - Linux Log Guardian data room | {date} | sayfa {page}/{total}",
        "subtitle": "Teknik kanit ozeti / Technical evidence brief",
        "badge_overall": "GENEL",
        "badge_review": "INCELE",
        "core_features": "Core ozellikleri",
        "honest_section": "Ne iddia etmiyoruz",
        "scorecard": "Scorecard",
        "sc_field": "Alan",
        "sc_metric": "Metrik",
        "sc_status": "Durum",
        "sc_note": "Not",
        "versus_section": "Rakip karsilastirma (olculmus)",
        "versus_feature": "Ozellik",
        "tests_section": "Yaptigimiz Testler",
        "tests_subtitle": "Her release'te otomatik kosulan dogrulamalar",
        "tests_missing": "validationTests bolumu yok - competitive_proof_build.py guncelleyin.",
        "evidence_section": "Teknik Kanitlar",
        "evidence_subtitle": "Benchmark, uyumluluk, ban gecikmesi, stabilite",
        "bench_section": "Benchmark (ayni corpus, referans)",
        "bench_metric": "Metrik",
        "bench_guardian": "Log Guardian",
        "bench_crs": "CRS regex replay",
        "crs_section": "CRS parite",
        "compliance_section": "Uyumluluk ozeti",
        "ban_section": "Ban gecikmesi (log -> kernel)",
        "soak_section": "Stabilite soak",
        "code_section": "Kod tabani",
        "missing_inputs": "Eksik girdiler",
        "footer_gen": "Uretim: bash scripts/sprint_a.sh | Dashboard: /tests | Ham JSON: competitive-proof.json, data-room.zip",
        "ban_ok": "GECTI",
        "ban_fail": "KALDI",
        "ban_pending": "sudo bash scripts/bench_ban_latency.sh",
        "compliance_body": "Kontroller: {passed}/{total} ({rate}% gecti). FP: {fp}%. Standartlar: {stds}",
        "ban_body": (
            "Medyan: {median} ms (n={n}, p90={p90} ms). "
            "Hedef <{target} ms (laptop IPC), prod <{prod} ms. "
            "Yol: {path}, ipset: {ipset}. Durum: {status}."
        ),
        "soak_body": "{dur:.2f} saat, {samples} ornek, {failures} hata, max_rss={rss} KB. Gecti: {passed}.",
        "code_body": "{lines:,} satir, {files} dosya (node_modules/vendor haric).",
        "crs_body": "Saldiri recall: {recall}%, benign FP: {fp}%, parite: {parity}%, CRS pattern: {patterns}",
    },
    "en": {
        "footer": "CONFIDENTIAL - Linux Log Guardian data room | {date} | page {page}/{total}",
        "subtitle": "Technical evidence brief",
        "badge_overall": "OVERALL",
        "badge_review": "REVIEW",
        "core_features": "Core capabilities",
        "honest_section": "What we do not claim",
        "scorecard": "Scorecard",
        "sc_field": "Area",
        "sc_metric": "Metric",
        "sc_status": "Status",
        "sc_note": "Note",
        "versus_section": "Competitor comparison (measured)",
        "versus_feature": "Feature",
        "tests_section": "Validation tests",
        "tests_subtitle": "Automated checks on every release",
        "tests_missing": "validationTests section missing — update competitive_proof_build.py.",
        "evidence_section": "Technical evidence",
        "evidence_subtitle": "Benchmark, compliance, ban latency, stability",
        "bench_section": "Benchmark (same corpus, reference)",
        "bench_metric": "Metric",
        "bench_guardian": "Log Guardian",
        "bench_crs": "CRS regex replay",
        "crs_section": "CRS parity",
        "compliance_section": "Compliance summary",
        "ban_section": "Ban latency (log -> kernel)",
        "soak_section": "Stability soak",
        "code_section": "Codebase",
        "missing_inputs": "Missing inputs",
        "footer_gen": "Generate: bash scripts/sprint_a.sh | Dashboard: /tests | Raw JSON: competitive-proof.json, data-room.zip",
        "ban_ok": "PASS",
        "ban_fail": "FAIL",
        "ban_pending": "run sudo bash scripts/bench_ban_latency.sh",
        "compliance_body": "Controls: {passed}/{total} ({rate}% passed). FP: {fp}%. Standards: {stds}",
        "ban_body": (
            "Median: {median} ms (n={n}, p90={p90} ms). "
            "Target <{target} ms (laptop IPC), prod <{prod} ms. "
            "Path: {path}, ipset: {ipset}. Status: {status}."
        ),
        "soak_body": "{dur:.2f} hours, {samples} samples, {failures} failures, max_rss={rss} KB. Pass: {passed}.",
        "code_body": "{lines:,} lines, {files} files (excl. node_modules/vendor).",
        "crs_body": "Attack recall: {recall}%, benign FP: {fp}%, parity: {parity}%, CRS patterns: {patterns}",
    },
}


def S(key: str) -> str:
    return STRINGS.get(LOCALE, STRINGS["tr"]).get(key, key)

C_NAVY = (15, 23, 42)
C_ACCENT = (14, 116, 144)
C_PASS = (22, 101, 52)
C_WARN = (180, 83, 9)
C_FAIL = (185, 28, 28)
C_MUTED = (100, 116, 139)
C_LIGHT = (241, 245, 249)
C_CYAN = (6, 182, 212)

LOGO_CANDIDATES = (
    ROOT / "assets" / "pdf-brand.png",
    ROOT / "dashboard" / "public" / "brand-logo-circle.png",
    ROOT / "dashboard" / "public" / "brand-phoenix-bird.png",
)


def pdf_safe(text: str) -> str:
    text = (
        str(text)
        .replace("—", "-")
        .replace("–", "-")
        .replace(""", '"')
        .replace(""", '"')
        .replace("'", "'")
        .replace("'", "'")
        .replace("≥", ">=")
        .replace("«", '"')
        .replace("»", '"')
    )
    tr = str.maketrans("ıİğĞüÜşŞöÖçÇ", "iIgGuUsSoOcC")
    return text.translate(tr).encode("latin-1", "replace").decode("latin-1")


def status_color(status: str) -> tuple[int, int, int]:
    s = (status or "").upper()
    if s in ("PASS", "GECTI", "OK"):
        return C_PASS
    if s in ("FAIL", "KALDI"):
        return C_FAIL
    if s in ("WARN", "PENDING", "BEKLEMEDE", "INFO"):
        return C_WARN
    return C_MUTED


class GuardianPDF:
    """FPDF sarmalayici — footer cakismasi ve hucre tasmasi duzeltildi."""

    def __init__(self, report_date: str) -> None:
        from fpdf import FPDF

        self.report_date = report_date[:10]
        self.lm = 18.0
        self.rm = 18.0
        self.tm = 18.0
        self.bm = 16.0

        class _Doc(FPDF):
            pass

        self.pdf = _Doc()
        self.pdf.set_margins(self.lm, self.tm, self.rm)
        self.pdf.set_auto_page_break(auto=True, margin=self.bm)
        self.pdf.alias_nb_pages()
        self.w = self.pdf.epw
        self._bind_footer()

    def _bind_footer(self) -> None:
        report_date = self.report_date
        bm = self.bm

        def footer() -> None:
            p = self.pdf
            p.set_y(-bm)
            p.set_font("Helvetica", "I", 7)
            p.set_text_color(*C_MUTED)
            p.cell(
                0,
                5,
                pdf_safe(
                    S("footer").format(
                        date=report_date,
                        page=p.page_no(),
                        total="{nb}",
                    )
                ),
                align="C",
            )
            p.set_text_color(0, 0, 0)

        self.pdf.footer = footer  # type: ignore[method-assign]

    @property
    def y(self) -> float:
        return self.pdf.get_y()

    def add_page(self) -> None:
        self.pdf.add_page()

    def ln(self, h: float = 1) -> None:
        self.pdf.ln(h)

    def ensure_space(self, need_mm: float) -> None:
        if self.y + need_mm > self.pdf.h - self.bm:
            self.add_page()

    def draw_logo(self, x: float, y: float, size: float = 12.0) -> None:
        """Phoenix PNG (sadece kus) veya vektor yedek."""
        p = self.pdf
        png = next((path for path in LOGO_CANDIDATES if path.is_file()), None)
        if png:
            p.image(str(png), x=x, y=y, w=size, h=size)
            return
        r = size / 2
        cx, cy = x + r, y + r
        p.set_fill_color(*C_NAVY)
        p.set_draw_color(*C_CYAN)
        p.circle(cx, cy, r, style="DF")
        p.set_font("Helvetica", "B", size * 1.1)
        p.set_text_color(255, 255, 255)
        p.set_xy(x, y + size * 0.22)
        p.cell(size, size * 0.5, "LG", align="C")
        p.set_text_color(0, 0, 0)

    def header_band(self, title: str, subtitle: str = "") -> None:
        p = self.pdf
        logo_x = 14.0
        logo_size = 28.0
        logo_y = 7.0
        text_x = logo_x + logo_size + 6.0
        band_h = 48.0
        p.set_fill_color(*C_NAVY)
        p.rect(0, 0, 210, band_h, style="F")
        self.draw_logo(logo_x, logo_y, logo_size)
        p.set_xy(text_x, 11)
        p.set_text_color(255, 255, 255)
        p.set_font("Helvetica", "B", 13)
        p.cell(210 - text_x - 14, 7, pdf_safe(title), ln=True)
        if subtitle:
            p.set_x(text_x)
            p.set_font("Helvetica", "", 8.5)
            p.multi_cell(210 - text_x - 14, 4.5, pdf_safe(subtitle))
        p.set_text_color(0, 0, 0)
        p.set_y(band_h + 6)

    def section(self, title: str) -> None:
        self.ensure_space(14)
        p = self.pdf
        p.set_font("Helvetica", "B", 11)
        p.set_text_color(*C_NAVY)
        p.cell(0, 7, pdf_safe(title), ln=True)
        p.set_draw_color(*C_ACCENT)
        y = p.get_y()
        p.line(self.lm, y, self.lm + self.w, y)
        p.ln(5)
        p.set_text_color(0, 0, 0)

    def body(self, text: str, size: int = 9, indent: float = 0) -> None:
        p = self.pdf
        p.set_x(self.lm + indent)
        p.set_font("Helvetica", "", size)
        p.multi_cell(self.w - indent, 4.5, pdf_safe(text))

    def bullet(self, text: str) -> None:
        self.body(f"- {text}", 9, indent=2)

    def badge(self, label: str, status: str) -> None:
        p = self.pdf
        color = status_color(status)
        p.set_fill_color(*color)
        p.set_text_color(255, 255, 255)
        p.set_font("Helvetica", "B", 10)
        p.cell(36, 8, pdf_safe(label), align="C", fill=True)
        p.set_text_color(0, 0, 0)
        p.ln(10)

    def _row_heights(self, texts: list[str], widths: list[float], line_h: float) -> tuple[float, list[list[str]]]:
        from fpdf import FPDF

        probe = FPDF()
        probe.add_page()
        probe.set_font("Helvetica", "", 8)
        wrapped: list[list[str]] = []
        max_h = line_h
        for text, width in zip(texts, widths):
            lines = probe.multi_cell(width, line_h, pdf_safe(text), dry_run=True, output="LINES")
            wrapped.append(lines)
            max_h = max(max_h, line_h * len(lines))
        return max_h, wrapped

    def scorecard_table(self, rows: list[dict[str, Any]]) -> None:
        p = self.pdf
        widths = [self.w * 0.20, self.w * 0.26, self.w * 0.11, self.w * 0.43]
        headers = [S("sc_field"), S("sc_metric"), S("sc_status"), S("sc_note")]
        line_h = 4.8

        self.ensure_space(12)
        p.set_font("Helvetica", "B", 8)
        p.set_fill_color(*C_LIGHT)
        for h, wd in zip(headers, widths):
            p.cell(wd, 6, pdf_safe(h), border=1, fill=True)
        p.ln()

        p.set_font("Helvetica", "", 8)
        for row in rows:
            st = str(row.get("status", ""))
            cells = [
                str(row.get("category", "")),
                str(row.get("metric", "")),
                st,
                str(row.get("note", ""))[:140],
            ]
            row_h, _ = self._row_heights(cells, widths, line_h)
            self.ensure_space(row_h + 2)
            x0 = p.get_x()
            y0 = p.get_y()
            for i, (txt, wd) in enumerate(zip(cells, widths)):
                p.set_xy(x0 + sum(widths[:i]), y0)
                if i == 2:
                    p.set_text_color(*status_color(st))
                    p.set_font("Helvetica", "B", 8)
                else:
                    p.set_text_color(0, 0, 0)
                    p.set_font("Helvetica", "", 8)
                p.multi_cell(wd, line_h, pdf_safe(txt), border=1)
            p.set_xy(x0, y0 + row_h)
        p.set_text_color(0, 0, 0)
        p.ln(2)

    def validation_block(self, tests: list[dict[str, Any]]) -> None:
        p = self.pdf
        badge_w = 20.0
        en = LOCALE == "en"
        for t in tests:
            st = str(
                (t.get("statusLabelEn") if en else t.get("statusLabel"))
                or t.get("status", "")
            )
            title = str((t.get("titleEn") if en else t.get("title")) or "")
            verdict = str((t.get("verdictEn") if en else t.get("verdict")) or "")
            self.ensure_space(20)
            x0 = self.lm
            y0 = p.get_y()
            p.set_xy(x0, y0)
            p.set_font("Helvetica", "B", 9)
            p.set_text_color(*status_color(st))
            p.cell(badge_w, 5, pdf_safe(f"[{st}]"), ln=0)
            p.set_text_color(0, 0, 0)
            p.multi_cell(self.w - badge_w, 5, pdf_safe(title))
            p.set_x(x0 + 3)
            p.set_font("Helvetica", "", 8)
            p.set_text_color(*C_MUTED)
            p.multi_cell(self.w - 3, 4.2, pdf_safe(verdict))
            p.set_text_color(0, 0, 0)
            p.ln(4)

    def bench_table(self, bench: dict[str, Any]) -> None:
        lg = bench.get("log_guardian") or {}
        ms = bench.get("modsecurity") or {}
        p = self.pdf
        col = self.w / 3
        line_h = 5.0
        p.set_font("Helvetica", "B", 8)
        p.set_fill_color(*C_LIGHT)
        for h in [S("bench_metric"), S("bench_guardian"), S("bench_crs")]:
            p.cell(col, 6, pdf_safe(h), border=1, fill=True)
        p.ln()
        p.set_font("Helvetica", "", 8)
        if LOCALE == "en":
            rows = [
                ("EPS (reference)", lg.get("eps", "-"), ms.get("eps", "-")),
                ("Line latency (us)", lg.get("latency_us_per_line", "-"), ms.get("latency_us_per_line", "-")),
                ("Corpus lines", bench.get("lines", "-"), bench.get("lines", "-")),
                ("Max RSS (KB)", lg.get("maxrss_kb", "-"), "-"),
            ]
        else:
            rows = [
                ("EPS (referans)", lg.get("eps", "-"), ms.get("eps", "-")),
                ("Satir gecikmesi (us)", lg.get("latency_us_per_line", "-"), ms.get("latency_us_per_line", "-")),
                ("Corpus satir", bench.get("lines", "-"), bench.get("lines", "-")),
                ("Max RSS (KB)", lg.get("maxrss_kb", "-"), "-"),
            ]
        for label, g, m in rows:
            p.cell(col, line_h, pdf_safe(str(label)), border=1)
            p.cell(col, line_h, pdf_safe(str(g)), border=1)
            p.cell(col, line_h, pdf_safe(str(m)), border=1, ln=True)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.pdf.output(str(path))


def main() -> int:
    global LOCALE
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", type=Path, default=ROOT / "competitive-proof.json")
    ap.add_argument("-o", "--output", type=Path, default=ROOT / "competitive-proof.pdf")
    ap.add_argument("--locale", choices=("tr", "en"), default="en")
    args = ap.parse_args()
    LOCALE = args.locale

    try:
        from fpdf import FPDF  # noqa: F401
    except ImportError:
        print("[ERR] fpdf2 gerekli: pip install fpdf2", file=sys.stderr)
        return 1

    if not args.input.is_file():
        print(f"[ERR] {args.input} yok", file=sys.stderr)
        return 1

    data = json.loads(args.input.read_text(encoding="utf-8"))
    sections = data.get("sections") or {}
    scorecard = data.get("scorecard") or []
    tests = data.get("validationTests") or []
    positioning = data.get("positioning") or {}
    en = LOCALE == "en"

    doc = GuardianPDF(str(data.get("reportDate", "")))

    doc.add_page()
    doc.header_band("Linux Log Guardian", S("subtitle"))
    doc.badge(
        S("badge_overall") if data.get("pass") else S("badge_review"),
        "PASS" if data.get("pass") else "WARN",
    )
    purpose = positioning.get("purposeEn" if en else "purposeTr") or positioning.get("purposeTr", "")
    doc.body(purpose, 10)
    doc.ln(3)

    doc.section(S("core_features"))
    bullets = positioning.get("valueBulletsEn" if en else "valueBulletsTr") or positioning.get("valueBulletsTr", [])
    for line in bullets:
        doc.bullet(line)

    doc.ln(2)
    doc.section(S("honest_section"))
    honest = positioning.get("honestBulletsEn" if en else "honestBulletsTr") or positioning.get("honestBulletsTr", [])
    for line in honest:
        doc.bullet(line)

    doc.ln(2)
    doc.section(S("scorecard"))
    doc.scorecard_table(scorecard)

    versus = data.get("versusCompetitors") or {}
    if versus.get("rows"):
        doc.ln(2)
        doc.section(S("versus_section"))
        tagline = versus.get("taglineEn" if en else "taglineTr") or versus.get("taglineTr", "")
        doc.body(str(tagline)[:320], 8)
        doc.ln(2)
        headers = [S("versus_feature"), "Fail2ban", "CrowdSec", "ModSec", "Guardian"]
        widths = [doc.w * 0.28, doc.w * 0.16, doc.w * 0.16, doc.w * 0.18, doc.w * 0.22]
        doc.pdf.set_font("Helvetica", "B", 7)
        for h, w in zip(headers, widths):
            doc.pdf.cell(w, 6, pdf_safe(h), border=1)
        doc.pdf.ln()
        doc.pdf.set_font("Helvetica", "", 7)
        for row in versus["rows"]:
            vals = [
                row.get("feature", ""),
                row.get("fail2ban", ""),
                row.get("crowdsec", ""),
                row.get("modsecurity", ""),
                row.get("guardian", ""),
            ]
            for v, w in zip(vals, widths):
                doc.pdf.cell(w, 6, pdf_safe(str(v)[:42]), border=1)
            doc.pdf.ln()

    doc.add_page()
    doc.header_band(S("tests_section"), S("tests_subtitle"))
    if tests:
        doc.validation_block(tests)
    else:
        doc.body(S("tests_missing"))

    doc.add_page()
    doc.header_band(S("evidence_section"), S("evidence_subtitle"))

    bench = sections.get("benchmark") or {}
    if bench:
        doc.section(S("bench_section"))
        doc.bench_table(bench)
        note = (bench.get("comparison") or {}).get("summary") or ""
        if note:
            doc.ln(2)
            doc.body(str(note)[:280], 8)

    crs = sections.get("crsParity") or {}
    if crs:
        doc.ln(2)
        g = crs.get("guardian") or {}
        doc.section(S("crs_section"))
        doc.body(
            S("crs_body").format(
                recall=g.get("attack_recall_pct", "-"),
                fp=g.get("benign_fp_pct", "-"),
                parity=crs.get("parity_pct", "-"),
                patterns=crs.get("crs_pattern_count", "-"),
            )
        )

    comp = sections.get("compliance") or {}
    es = comp.get("executiveSummary") or {}
    if es:
        doc.ln(2)
        doc.section(S("compliance_section"))
        stds = ", ".join(comp.get("standards") or [])
        doc.body(
            S("compliance_body").format(
                passed=es.get("controlsPassed"),
                total=es.get("controlsTotal"),
                rate=es.get("passRatePct"),
                fp=es.get("fpRatePct"),
                stds=stds,
            )
        )

    ban = sections.get("banLatency") or {}
    doc.ln(2)
    doc.section(S("ban_section"))
    if ban.get("ban_latency_ms") is not None:
        median = ban.get("median_ms", ban.get("ban_latency_ms"))
        status = S("ban_ok") if ban.get("pass") else S("ban_fail")
        doc.body(
            S("ban_body").format(
                median=median,
                n=ban.get("sample_count", 1),
                p90=ban.get("p90_ms", "-"),
                target=ban.get("target_ms", 75),
                prod=ban.get("prod_target_ms", 50),
                path=ban.get("ban_path", "-"),
                ipset=ban.get("ipset_confirmed"),
                status=status,
            )
        )
    else:
        doc.body(str(ban.get("note", S("ban_pending"))))

    soak = sections.get("soak") or {}
    if soak:
        doc.ln(2)
        doc.section(S("soak_section"))
        dur = soak.get("duration_hours") or (soak.get("duration_sec", 0) / 3600.0)
        doc.body(
            S("soak_body").format(
                dur=dur,
                samples=soak.get("samples", 0),
                failures=soak.get("failures", 0),
                rss=soak.get("max_rss_kb", "-"),
                passed=str(soak.get("pass")),
            )
        )

    stats = sections.get("codeStats") or {}
    doc.ln(2)
    doc.section(S("code_section"))
    doc.body(
        S("code_body").format(
            lines=stats.get("sourceLines", 0),
            files=stats.get("sourceFiles", 0),
        )
    )

    missing = data.get("missingInputs") or []
    if missing:
        doc.ln(2)
        doc.body(f"{S('missing_inputs')}: {', '.join(missing)}", 7)

    doc.ln(3)
    doc.body(S("footer_gen"), 7)

    doc.save(args.output)
    print(f"[competitive_proof_pdf] locale={LOCALE} -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
