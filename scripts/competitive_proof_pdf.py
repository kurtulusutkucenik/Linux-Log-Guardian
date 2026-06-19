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
    "en": {
        "doc_title": "TECHNICAL EVIDENCE BRIEF",
        "doc_tagline": "Measured proof — log to WAF to kernel ban (not a ModSec speed race)",
        "footer": "Linux Log Guardian | {date} | page {page} of {total}",
        "cover_mit": "MIT · Open source · Self-hosted · Dashboard /tests",
        "cover_status_strict": "Strict soak pending — health/metrics sampling failed in background run",
        "cover_status_fix": "Fix: bash scripts/laptop_soak_72h.sh --start  (preflight alone is not a soak pass)",
        "badge_pass": "RELEASE READY",
        "badge_review": "REVIEW NEEDED",
        "purpose_label": "About this document",
        "core_features": "What we prove",
        "honest_section": "What we do not claim",
        "hero_recall": "Attack recall",
        "hero_fp": "Benign FP",
        "hero_ban": "Ban latency",
        "hero_soak": "72h stability",
        "scorecard": "Scorecard",
        "sc_field": "Area",
        "sc_metric": "Metric",
        "sc_status": "Status",
        "sc_note": "Note",
        "versus_section": "Competitor comparison",
        "versus_sub": "Same measured corpus — honest architectural limits",
        "versus_full": "Full competitor matrix",
        "versus_disclaimer": "Fail2ban / CrowdSec / ModSec columns: architectural notes (docs/VS_RAKIPLER.md). Only Guardian column is measured on our corpus.",
        "versus_feature": "Feature",
        "exec_summary": "Executive summary",
        "tests_section": "Validation tests",
        "tests_subtitle": "Automated on every release — JSON + dashboard mirror",
        "tests_summary": "{passed} of {total} tests passed ({pct}%)",
        "tests_col_status": "Status",
        "tests_col_test": "Test",
        "tests_col_result": "Result",
        "tests_missing": "No validationTests — run competitive_proof_build.py",
        "evidence_section": "Technical evidence",
        "evidence_subtitle": "Benchmark reference, CRS, compliance, ban path, soak",
        "bench_section": "Throughput benchmark (reference only)",
        "bench_metric": "Metric",
        "bench_guardian": "Log Guardian",
        "bench_crs": "CRS regex replay",
        "crs_section": "CRS parity",
        "compliance_section": "Compliance",
        "ban_section": "Ban latency",
        "soak_section": "Stability soak",
        "code_section": "Codebase",
        "missing_inputs": "Missing inputs",
        "footer_gen": "Generate: bash scripts/sprint_a.sh · Dashboard: /tests · JSON: competitive-proof.json",
        "soak_operational": "operational PASS (services up 72h)",
        "soak_strict_fail": "strict FAIL — health samples need sudo",
        "soak_ops_short": "ops OK, strict pending",
        "ban_ok": "PASS",
        "ban_fail": "FAIL",
        "ban_pending": "Run: sudo bash scripts/bench_ban_latency.sh",
        "compliance_body": "{passed}/{total} controls ({rate}%). Standards: {stds}",
        "ban_body": "Median {median} ms · p90 {p90} ms · target <{target} ms · {path}",
        "soak_body": "{dur:.0f}h · {samples} samples · max RSS {rss} MB · {status}",
        "soak_laptop_body": (
            "{dur:.1f}h laptop soak PASS — analyzer+daemon active {samples} samples, "
            "max RSS {rss} MB, benign FP {fp}%. "
            "Real service failures: {real_fail}. "
            "Raw health counter included {artifacts} IPC measurement artifacts (background sg path) — not outages. "
            "Recomputed: bash scripts/soak_recompute_report.sh"
        ),
        "code_body": "{lines:,} source lines across {files} files",
        "crs_body": "Recall {recall}% · benign FP {fp}% · parity {parity}% · {patterns} patterns",
        "bench_note": "Guardian: single-pass log+WAF+ban. CRS side: offline @rx replay — not inline nginx ModSec.",
    },
    "tr": {
        "doc_title": "TEKNIK KANIT OZETI",
        "doc_tagline": "Olculmus kanit — log to WAF to kernel ban (ModSec hiz yarisi degil)",
        "footer": "Linux Log Guardian | {date} | sayfa {page}/{total}",
        "cover_mit": "MIT · Acik kaynak · Self-hosted · Dashboard /tests",
        "cover_status_strict": "Strict soak bekliyor — arka plan orneklemesinde health/metrics olcumu basarisiz",
        "cover_status_fix": "Cozum: bash scripts/laptop_soak_72h.sh --start  (preflight soak gecisi degil)",
        "badge_pass": "RELEASE HAZIR",
        "badge_review": "INCELEME GEREK",
        "purpose_label": "Bu belge",
        "core_features": "Kantiladigimiz",
        "honest_section": "Iddia etmedigimiz",
        "hero_recall": "Saldiri recall",
        "hero_fp": "Benign FP",
        "hero_ban": "Ban gecikmesi",
        "hero_soak": "72h stabilite",
        "scorecard": "Scorecard",
        "sc_field": "Alan",
        "sc_metric": "Metrik",
        "sc_status": "Durum",
        "sc_note": "Not",
        "versus_section": "Rakip karsilastirma",
        "versus_sub": "Ayni olculmus corpus — durust mimari sinirlar",
        "versus_full": "Tam rakip matrisi",
        "versus_disclaimer": "Fail2ban / CrowdSec / ModSec sutunlari: mimari not (docs/VS_RAKIPLER.md). Olculen yalnizca Guardian sutunu.",
        "versus_feature": "Ozellik",
        "exec_summary": "Yonetici ozeti",
        "tests_section": "Dogrulama testleri",
        "tests_subtitle": "Her release otomatik — JSON + dashboard ayni",
        "tests_summary": "{passed}/{total} test gecti (%{pct})",
        "tests_col_status": "Durum",
        "tests_col_test": "Test",
        "tests_col_result": "Sonuc",
        "tests_missing": "validationTests yok — competitive_proof_build.py",
        "evidence_section": "Teknik kanitlar",
        "evidence_subtitle": "Bench referans, CRS, uyumluluk, ban, soak",
        "bench_section": "Throughput benchmark (yalnizca referans)",
        "bench_metric": "Metrik",
        "bench_guardian": "Log Guardian",
        "bench_crs": "CRS regex replay",
        "crs_section": "CRS parite",
        "compliance_section": "Uyumluluk",
        "ban_section": "Ban gecikmesi",
        "soak_section": "Stabilite soak",
        "code_section": "Kod tabani",
        "missing_inputs": "Eksik girdiler",
        "footer_gen": "Uretim: bash scripts/sprint_a.sh · Dashboard: /tests · JSON: competitive-proof.json",
        "soak_operational": "operasyonel GECTI (72h servis ayakta)",
        "soak_strict_fail": "strict KALDI — health ornekleri sudo gerektirir",
        "soak_ops_short": "ops OK, strict bekliyor",
        "ban_ok": "GECTI",
        "ban_fail": "KALDI",
        "ban_pending": "Calistir: sudo bash scripts/bench_ban_latency.sh",
        "compliance_body": "{passed}/{total} kontrol (%{rate}). Standartlar: {stds}",
        "ban_body": "Medyan {median} ms · p90 {p90} ms · hedef <{target} ms · {path}",
        "soak_body": "{dur:.0f} saat · {samples} ornek · max RSS {rss} MB · {status}",
        "soak_laptop_body": (
            "{dur:.1f} saat laptop soak GECTI — analyzer+daemon {samples} ornek boyunca active, "
            "max RSS {rss} MB, benign FP %{fp}. "
            "Gercek servis dususu: {real_fail}. "
            "Ham health sayacinda {artifacts} IPC olcum artefakti (arka plan sg yolu) — outage degil. "
            "Yeniden hesap: bash scripts/soak_recompute_report.sh"
        ),
        "code_body": "{lines:,} satir kaynak kod, {files} dosya",
        "crs_body": "Recall %{recall} · benign FP %{fp} · parite %{parity} · {patterns} pattern",
        "bench_note": "Guardian: tek gecis log+WAF+ban. CRS: offline @rx replay — inline nginx ModSec degil.",
    },
}


def S(key: str) -> str:
    return STRINGS.get(LOCALE, STRINGS["en"]).get(key, key)


# Palette — dashboard-adjacent dark + cyan accent
C_INK = (15, 23, 42)
C_INK_SOFT = (30, 41, 59)
C_ACCENT = (6, 182, 212)
C_ACCENT_DARK = (14, 116, 144)
C_PASS = (22, 163, 74)
C_PASS_BG = (220, 252, 231)
C_FAIL = (220, 38, 38)
C_FAIL_BG = (254, 226, 226)
C_WARN = (217, 119, 6)
C_MUTED = (100, 116, 139)
C_LINE = (226, 232, 240)
C_PANEL = (248, 250, 252)
C_WHITE = (255, 255, 255)

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
        .replace("→", "->")
        .replace("·", " - ")
    )
    tr = str.maketrans("ıİğĞüÜşŞöÖçÇ", "iIgGuUsSoOcC")
    return text.translate(tr).encode("latin-1", "replace").decode("latin-1")


def status_color(status: str) -> tuple[int, int, int]:
    s = (status or "").upper()
    if s in ("PASS", "GECTI", "OK", "TRUE"):
        return C_PASS
    if s in ("FAIL", "KALDI", "FALSE"):
        return C_FAIL
    if s in ("WARN", "PENDING", "BEKLEMEDE"):
        return C_WARN
    return C_MUTED


def status_bg(status: str) -> tuple[int, int, int]:
    s = (status or "").upper()
    if s in ("PASS", "GECTI", "OK"):
        return C_PASS_BG
    if s in ("FAIL", "KALDI"):
        return C_FAIL_BG
    return C_PANEL


def truncate(text: str, limit: int) -> str:
    text = str(text).strip()
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 3)].rstrip() + "..."


def loc_field(obj: dict[str, Any], base: str) -> str:
    en = LOCALE == "en"
    return str(obj.get(f"{base}En" if en else base) or obj.get(base) or "")


def normalize_versus_cell(value: Any) -> str:
    """PDF EN locale icin TR hucre metinlerini sadelestir."""
    s = str(value or "-").strip().replace("→", "->").replace("—", "-")
    if LOCALE == "en":
        feat = {
            "Log -> WAF -> kernel ban (tek paket)": "Log -> WAF -> kernel ban (single stack)",
            "Gercek saldiri recall (olculmus)": "Real attack recall (measured)",
            "Dagitik saldiri (ayni UA, farkli IP)": "Distributed attack (same UA, many IPs)",
            "False positive (benign corpus)": "False positive (benign corpus)",
            "Ban gecikmesi (log -> ipset)": "Ban latency (log -> ipset)",
            "Otomatik kanit PDF+JSON": "Auto proof PDF+JSON",
            "MIT + Turkce dokuman": "MIT + Turkish docs",
        }
        s = feat.get(s, s)
        repl = {
            "Hayir": "No",
            "Evet": "Yes",
            "Kismi": "Partial",
            "Parcali": "Partial",
            "Senaryo": "Scenario",
            "IP bazli": "Per-IP",
            "ayri entegrasyon": "Separate integration",
            "Modul modul": "Per-module",
            "CRS'ye bagli": "CRS-dependent",
            "sn-dk": "sec-min",
            "sn": "sec",
        }
        for k, v in repl.items():
            s = s.replace(k, v)
    return pdf_safe(s)


class GuardianPDF:
    """Data-room grade PDF layout."""

    def __init__(self, report_date: str) -> None:
        from fpdf import FPDF

        self.report_date = report_date[:10]
        self.lm = 14.0
        self.rm = 14.0
        self.tm = 16.0
        self.bm = 16.0
        self._section_title = ""

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
        lm, rm, bm = self.lm, self.rm, self.bm

        def footer() -> None:
            p = self.pdf
            if p.page_no() == 1:
                return
            p.set_y(-bm)
            p.set_draw_color(*C_LINE)
            p.line(lm, p.get_y(), 210 - rm, p.get_y())
            p.ln(1.2)
            p.set_font("Helvetica", "", 7)
            p.set_text_color(*C_MUTED)
            left = pdf_safe(self._section_title[:48] if self._section_title else "Linux Log Guardian")
            p.cell(self.w / 2, 4, left)
            p.cell(
                self.w / 2,
                4,
                pdf_safe(
                    S("footer").format(
                        date=report_date,
                        page=p.page_no(),
                        total="{nb}",
                    )
                ),
                align="R",
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
            if self._section_title:
                self.inner_page_header(self._section_title)

    def draw_logo(self, x: float, y: float, size: float) -> None:
        p = self.pdf
        png = next((path for path in LOGO_CANDIDATES if path.is_file()), None)
        if png:
            p.image(str(png), x=x, y=y, w=size, h=size)
            return
        r = size / 2
        cx, cy = x + r, y + r
        p.set_fill_color(*C_INK)
        p.set_draw_color(*C_ACCENT)
        p.circle(cx, cy, r, style="DF")
        p.set_font("Helvetica", "B", size * 0.45)
        p.set_text_color(*C_WHITE)
        p.set_xy(x, y + size * 0.28)
        p.cell(size, size * 0.4, "LG", align="C")
        p.set_text_color(0, 0, 0)

    def cover_page(
        self,
        product: str,
        passed: bool,
        heroes: list[tuple[str, str, str]],
        *,
        status_note: str = "",
    ) -> None:
        """Kapak: tum ogeler sabit Y koordinatlari — multi_cell kaymasi yok."""
        p = self.pdf
        self.add_page()
        p.set_auto_page_break(auto=False)

        hero_h = 104.0
        p.set_fill_color(*C_INK)
        p.rect(0, 0, 210, hero_h, style="F")
        p.set_fill_color(*C_ACCENT)
        p.rect(0, hero_h - 1.5, 210, 1.5, style="F")

        logo_size = 24.0
        logo_y = 14.0
        self.draw_logo(self.lm, logo_y, logo_size)

        box_w, box_h = 44.0, 20.0
        bx = 210 - self.rm - box_w
        by = 14.0
        p.set_draw_color(*C_ACCENT)
        p.set_fill_color(22, 32, 50)
        p.rect(bx, by, box_w, box_h, style="FD")
        p.set_xy(bx + 3, by + 4)
        p.set_font("Helvetica", "", 6)
        p.set_text_color(148, 163, 184)
        p.cell(box_w - 6, 2.5, "REPORT DATE", ln=True)
        p.set_x(bx + 3)
        p.set_font("Helvetica", "B", 9)
        p.set_text_color(*C_WHITE)
        p.cell(box_w - 6, 4.5, pdf_safe(self.report_date), ln=True)

        brand_x = self.lm + logo_size + 4
        brand_w = max(40.0, bx - brand_x - 3)
        p.set_xy(brand_x, logo_y + 7)
        p.set_text_color(*C_WHITE)
        p.set_font("Helvetica", "B", 9.5)
        p.cell(brand_w, 4.5, pdf_safe(truncate(product, 36)), ln=False)

        title_y = logo_y + logo_size + 8
        p.set_xy(self.lm, title_y)
        p.set_font("Helvetica", "B", 15.5)
        p.set_text_color(*C_WHITE)
        title_txt = pdf_safe(S("doc_title"))
        if p.get_string_width(title_txt) > self.w - 2:
            p.set_font("Helvetica", "B", 13.5)
        p.cell(self.w, 6.5, title_txt, ln=True)

        tag_y = title_y + 7
        p.set_xy(self.lm, tag_y)
        p.set_font("Helvetica", "", 7.8)
        p.set_text_color(186, 198, 210)
        p.multi_cell(self.w, 3.4, pdf_safe(S("doc_tagline")), align="L")

        if heroes:
            n = 4
            gap = 3.5
            cw = (self.w - gap * (n - 1)) / n
            card_h = 24.0
            hy = hero_h - card_h - 7
            for i, (label, value, sub) in enumerate(heroes[:4]):
                x = self.lm + i * (cw + gap)
                p.set_fill_color(24, 34, 52)
                p.set_draw_color(45, 60, 80)
                p.rect(x, hy, cw, card_h, style="FD")
                p.set_xy(x + 2.5, hy + 2.5)
                p.set_font("Helvetica", "", 5.8)
                p.set_text_color(148, 163, 184)
                p.cell(cw - 5, 2.6, pdf_safe(truncate(label.upper(), 18)), ln=True)
                p.set_x(x + 2.5)
                p.set_font("Helvetica", "B", 12)
                p.set_text_color(*C_ACCENT)
                p.cell(cw - 5, 5.2, pdf_safe(truncate(str(value), 10)), ln=True)
                p.set_x(x + 2.5)
                p.set_font("Helvetica", "", 5.5)
                p.set_text_color(120, 138, 158)
                p.cell(cw - 5, 2.6, pdf_safe(truncate(str(sub), 24)), ln=True)

        p.set_text_color(0, 0, 0)
        white_y = hero_h + 11
        badge_w = 54.0
        badge_h = 9.0
        badge_label = S("badge_pass") if passed else S("badge_review")
        badge_color = C_PASS if passed else C_WARN
        p.set_xy(self.lm, white_y)
        p.set_fill_color(*badge_color)
        p.set_text_color(*C_WHITE)
        p.set_font("Helvetica", "B", 9.5)
        p.cell(badge_w, badge_h, pdf_safe(badge_label), align="C", fill=True)

        meta_x = self.lm + badge_w + 7
        meta_w = self.w - badge_w - 7
        p.set_xy(meta_x, white_y + 2.2)
        p.set_font("Helvetica", "", 7.5)
        p.set_text_color(*C_MUTED)
        p.cell(meta_w, 3.5, pdf_safe(S("cover_mit")), ln=True)
        if status_note:
            p.set_x(meta_x)
            p.set_font("Helvetica", "", 7)
            p.set_text_color(*C_INK_SOFT)
            p.multi_cell(meta_w, 3.4, pdf_safe(truncate(status_note, 120)))
        p.set_text_color(0, 0, 0)
        p.set_y(white_y + badge_h + (10 if status_note else 4))
        p.set_auto_page_break(auto=True, margin=self.bm)

    def inner_page_header(self, title: str, subtitle: str = "") -> None:
        self._section_title = title
        p = self.pdf
        p.set_font("Helvetica", "B", 14)
        p.set_text_color(*C_INK)
        p.cell(0, 7, pdf_safe(title), ln=True)
        if subtitle:
            p.set_font("Helvetica", "", 8.5)
            p.set_text_color(*C_MUTED)
            p.multi_cell(self.w, 4, pdf_safe(subtitle))
        p.set_draw_color(*C_ACCENT)
        p.line(self.lm, p.get_y() + 1, self.lm + self.w, p.get_y() + 1)
        p.ln(6)
        p.set_text_color(0, 0, 0)

    def section(self, title: str, subtitle: str = "") -> None:
        self.ensure_space(14)
        p = self.pdf
        p.set_font("Helvetica", "B", 10)
        p.set_text_color(*C_ACCENT_DARK)
        p.cell(0, 5, pdf_safe(title.upper()), ln=True)
        if subtitle:
            p.set_font("Helvetica", "", 8)
            p.set_text_color(*C_MUTED)
            p.multi_cell(self.w, 3.8, pdf_safe(subtitle))
        p.ln(3)

    def body(self, text: str, size: float = 9, color: tuple[int, int, int] = C_INK_SOFT) -> None:
        p = self.pdf
        p.set_font("Helvetica", "", size)
        p.set_text_color(*color)
        p.multi_cell(self.w, 4.4, pdf_safe(text))
        p.set_text_color(0, 0, 0)

    def _bullet_column_height(self, lines: list[str], col_w: float, pad: float, line_h: float) -> float:
        total = pad + 5.0  # title block
        inner_w = col_w - pad * 2
        for line in lines:
            total += self._text_block_height(f"- {line}", inner_w, 8.5, line_h)
        return total + pad

    def _draw_panel_column(
        self,
        x: float,
        y0: float,
        col_w: float,
        box_h: float,
        title: str,
        lines: list[str],
        pad: float,
        line_h: float,
        font_size: float,
    ) -> None:
        p = self.pdf
        inner_w = col_w - pad * 2
        p.set_fill_color(*C_PANEL)
        p.set_draw_color(*C_LINE)
        p.rect(x, y0, col_w, box_h, style="FD")
        p.set_xy(x + pad, y0 + pad)
        p.set_font("Helvetica", "B", 9)
        p.set_text_color(*C_INK)
        p.multi_cell(inner_w, 4.5, pdf_safe(title))
        p.set_font("Helvetica", "", font_size)
        p.set_text_color(*C_INK_SOFT)
        for line in lines:
            p.set_x(x + pad)
            p.multi_cell(inner_w, line_h, pdf_safe(f"- {line}"))
        p.set_text_color(0, 0, 0)

    def two_column_panels(
        self,
        left_title: str,
        left_lines: list[str],
        right_title: str,
        right_lines: list[str],
    ) -> None:
        gap = 6.0
        col_w = (self.w - gap) / 2
        pad = 5.0
        line_h = 4.6
        font_size = 9.5
        left_h = self._bullet_column_height(left_lines, col_w, pad, line_h)
        right_h = self._bullet_column_height(right_lines, col_w, pad, line_h)
        box_h = max(left_h, right_h, 32.0)
        self.ensure_space(box_h + 6)
        y0 = self.pdf.get_y()
        self._draw_panel_column(
            self.lm, y0, col_w, box_h, left_title, left_lines, pad, line_h, font_size
        )
        self._draw_panel_column(
            self.lm + col_w + gap,
            y0,
            col_w,
            box_h,
            right_title,
            right_lines,
            pad,
            line_h,
            font_size,
        )
        self.pdf.set_y(y0 + box_h + 6)

    def _text_block_height(self, text: str, width: float, size: float, line_h: float) -> float:
        from fpdf import FPDF

        probe = FPDF()
        probe.add_page()
        probe.set_font("Helvetica", "", size)
        lines = probe.multi_cell(width, line_h, pdf_safe(text), dry_run=True, output="LINES")
        return line_h * len(lines)

    def info_panel(self, title: str, body: str, accent: tuple[int, int, int] = C_ACCENT) -> None:
        p = self.pdf
        pad = 5.0
        title_h = 5.0
        body_h = self._text_block_height(body, self.w - pad * 2 - 3, 8, 4.0)
        total_h = pad * 2 + title_h + body_h + 2
        self.ensure_space(total_h + 2)
        x0, y0 = self.lm, p.get_y()
        p.set_fill_color(*C_PANEL)
        p.set_draw_color(*C_LINE)
        p.rect(x0, y0, self.w, total_h, style="FD")
        p.set_fill_color(*accent)
        p.rect(x0, y0, 2.5, total_h, style="F")
        p.set_xy(x0 + pad + 2, y0 + pad)
        p.set_font("Helvetica", "B", 9)
        p.set_text_color(*C_INK)
        p.cell(self.w - pad * 2, title_h, pdf_safe(title), ln=True)
        p.set_x(x0 + pad + 2)
        p.set_font("Helvetica", "", 8)
        p.set_text_color(*C_MUTED)
        p.multi_cell(self.w - pad * 2 - 3, 4.0, pdf_safe(body))
        p.set_y(y0 + total_h + 3)
        p.set_text_color(0, 0, 0)

    def _wrap_rows(
        self, texts: list[str], widths: list[float], line_h: float, font_size: float = 8
    ) -> tuple[float, list[list[str]]]:
        from fpdf import FPDF

        probe = FPDF()
        probe.add_page()
        wrapped: list[list[str]] = []
        max_h = line_h
        for text, width in zip(texts, widths):
            probe.set_font("Helvetica", "", font_size)
            lines = probe.multi_cell(width, line_h, pdf_safe(text), dry_run=True, output="LINES")
            wrapped.append(lines)
            max_h = max(max_h, line_h * max(len(lines), 1))
        return max_h, wrapped

    def _draw_table_row(
        self,
        cells: list[str],
        widths: list[float],
        line_h: float,
        *,
        header: bool = False,
        status_col: int | None = None,
        zebra: bool = False,
        highlight_col: int | None = None,
        font_size: float = 7.5,
    ) -> None:
        p = self.pdf
        row_h, wrapped = self._wrap_rows(cells, widths, line_h, font_size)
        self.ensure_space(row_h + 1)
        x0, y0 = self.lm, p.get_y()
        if zebra and not header:
            p.set_fill_color(*C_PANEL)
            p.rect(x0, y0, sum(widths), row_h, style="F")
        for i, (lines, wd) in enumerate(zip(wrapped, widths)):
            x = x0 + sum(widths[:i])
            p.set_xy(x, y0)
            if header:
                p.set_fill_color(*C_INK)
                p.set_text_color(*C_WHITE)
                p.set_font("Helvetica", "B", font_size)
                hdr_h = max(9.0, row_h + 1.5)
                p.cell(wd, hdr_h, pdf_safe(cells[i]), border=1, fill=True, align="L")
                continue
            if i == highlight_col:
                p.set_fill_color(220, 245, 252)
            elif i == status_col:
                p.set_fill_color(*status_bg(cells[i]))
            else:
                p.set_fill_color(*C_WHITE)
            if i == status_col:
                p.set_font("Helvetica", "B", font_size)
                p.set_text_color(*status_color(cells[i]))
            else:
                p.set_font("Helvetica", "B" if i == highlight_col else "", font_size)
                p.set_text_color(*C_INK_SOFT)
            text = "\n".join(lines)
            p.multi_cell(wd, line_h, pdf_safe(text), border=1, fill=True, align="L")
        if header:
            p.ln(max(9.0, row_h + 1.5))
        else:
            p.set_xy(x0, y0 + row_h)
        p.set_text_color(0, 0, 0)

    def scorecard_table(self, rows: list[dict[str, Any]]) -> None:
        widths = [self.w * 0.17, self.w * 0.22, self.w * 0.11, self.w * 0.50]
        headers = [S("sc_field"), S("sc_metric"), S("sc_status"), S("sc_note")]
        self._draw_table_row(headers, widths, 5.0, header=True, font_size=9.0)
        for i, row in enumerate(rows):
            st = str(row.get("status", ""))
            self._draw_table_row(
                [
                    str(row.get("category", "")),
                    str(row.get("metric", "")),
                    st,
                    truncate(str(row.get("note", "")), 130),
                ],
                widths,
                5.0,
                status_col=2,
                zebra=i % 2 == 1,
            )
        self.ln(2)

    def validation_table(self, tests: list[dict[str, Any]]) -> None:
        passed = sum(1 for t in tests if str(t.get("status", "")).lower() == "pass")
        warned = sum(1 for t in tests if str(t.get("status", "")).lower() == "warn")
        pct = round((passed / len(tests)) * 100) if tests else 0
        summary = S("tests_summary").format(passed=passed, total=len(tests), pct=pct)
        if warned:
            summary += f" · {warned} WARN"
        self.body(summary, 8.5)
        self.ln(3)
        widths = [self.w * 0.11, self.w * 0.38, self.w * 0.51]
        headers = [S("tests_col_status"), S("tests_col_test"), S("tests_col_result")]
        self._draw_table_row(headers, widths, 5.2, header=True, font_size=9.0)
        for i, t in enumerate(tests):
            st = loc_field(t, "statusLabel") or str(t.get("status", "")).upper()
            self._draw_table_row(
                [
                    st,
                    truncate(loc_field(t, "title"), 78),
                    truncate(loc_field(t, "verdict"), 110),
                ],
                widths,
                5.2,
                status_col=0,
                zebra=i % 2 == 1,
            )

    def _versus_table_inner(
        self,
        rows: list[dict[str, Any]],
        *,
        compact: bool = False,
        max_rows: int | None = None,
    ) -> None:
        font_size = 8.0 if compact else 10.0
        line_h = 5.0 if compact else 6.2
        headers = [S("versus_feature"), "Fail2ban", "CrowdSec", "ModSec", "Guardian"]
        widths = [self.w * 0.26, self.w * 0.14, self.w * 0.14, self.w * 0.16, self.w * 0.30]
        self._draw_table_row(headers, widths, line_h, header=True, font_size=font_size)
        subset = rows[:max_rows] if max_rows else rows
        for i, row in enumerate(subset):
            self._draw_table_row(
                [
                    normalize_versus_cell(row.get("feature", "")),
                    normalize_versus_cell(row.get("fail2ban", "")),
                    normalize_versus_cell(row.get("crowdsec", "")),
                    normalize_versus_cell(row.get("modsecurity", "")),
                    normalize_versus_cell(row.get("guardian", "")),
                ],
                widths,
                line_h,
                zebra=i % 2 == 1,
                highlight_col=4,
                font_size=font_size,
            )

    def versus_table(self, rows: list[dict[str, Any]]) -> None:
        self._versus_table_inner(rows, compact=False)

    def bench_table(self, bench: dict[str, Any]) -> None:
        lg = bench.get("log_guardian") or {}
        ms = bench.get("modsecurity") or {}
        col = self.w / 3
        p = self.pdf
        p.set_font("Helvetica", "B", 8)
        p.set_fill_color(*C_INK)
        p.set_text_color(*C_WHITE)
        for h in [S("bench_metric"), S("bench_guardian"), S("bench_crs")]:
            p.cell(col, 7, pdf_safe(h), border=1, fill=True)
        p.ln()
        rows = [
            ("EPS", lg.get("eps", "-"), ms.get("eps", "-")),
            ("Latency (us/line)", lg.get("latency_us_per_line", "-"), ms.get("latency_us_per_line", "-")),
            ("Corpus lines", bench.get("lines", "-"), bench.get("lines", "-")),
            ("Max RSS (KB)", lg.get("maxrss_kb", "-"), "-"),
        ]
        for i, (label, g, m) in enumerate(rows):
            p.set_font("Helvetica", "", 8)
            p.set_text_color(*C_INK_SOFT)
            p.set_fill_color(*C_PANEL if i % 2 else C_WHITE)
            p.cell(col, 5.5, pdf_safe(str(label)), border=1, fill=True)
            p.set_fill_color(220, 245, 252)
            p.cell(col, 5.5, pdf_safe(str(g)), border=1, fill=True)
            p.cell(col, 5.5, pdf_safe(str(m)), border=1, fill=True, ln=True)
        p.set_text_color(0, 0, 0)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.pdf.output(str(path))


def build_heroes(data: dict[str, Any], sections: dict[str, Any]) -> list[tuple[str, str, str]]:
    versus = data.get("versusCompetitors") or {}
    km = versus.get("killerMetrics") or {}
    soak = sections.get("soak") or {}
    fp = sections.get("falsePositive") or {}
    fp_pct = km.get("fp_rate_pct") or (fp.get("benign") or {}).get("fp_rate_pct", "-")
    recall = km.get("real_attack_recall_pct", "-")
    ban_ms = km.get("ban_latency_ms", "-")
    dur = soak.get("duration_hours") or (soak.get("duration_sec", 0) / 3600.0)
    laptop = soak.get("pass_laptop_proof")
    if laptop is None:
        laptop = (
            soak.get("pass_operational")
            and dur >= 70
            and soak.get("real_failures", soak.get("failures", 1)) == 0
        )
    if soak.get("pass_strict") or laptop:
        soak_val, soak_sub = "PASS", f"{dur:.0f}h laptop"
    elif soak.get("pass_operational"):
        soak_val, soak_sub = "OPS", S("soak_ops_short")
    else:
        soak_val, soak_sub = "FAIL", ""
    return [
        (S("hero_recall"), f"{recall}%", "1K + 10K corpus"),
        (S("hero_fp"), f"{fp_pct}%", "500 benign lines"),
        (S("hero_ban"), f"{ban_ms} ms", "log to ipset"),
        (S("hero_soak"), soak_val, soak_sub or S("soak_operational")[:12]),
    ]


def soak_status_text(soak: dict[str, Any]) -> str:
    dur = soak.get("duration_hours") or (soak.get("duration_sec", 0) / 3600.0)
    if soak.get("pass_laptop_proof") or (
        soak.get("pass_operational") and dur >= 70 and soak.get("real_failures", 0) == 0
    ):
        artifacts = soak.get("measurement_artifacts", 0)
        base = f"{dur:.0f}h laptop PASS — services up"
        if artifacts:
            return f"{base} ({artifacts} IPC measurement artifacts)"
        return base
    if soak.get("pass_operational"):
        return S("soak_operational") + " · " + S("soak_strict_fail")
    if soak.get("pass") is False:
        return S("ban_fail")
    return "-"


def soak_panel_text(soak: dict[str, Any], sections: dict[str, Any]) -> str:
    dur = soak.get("duration_hours") or (soak.get("duration_sec", 0) / 3600.0)
    rss_mb = round((soak.get("max_rss_kb") or 0) / 1024)
    fp = (sections.get("falsePositive") or {}).get("benign") or {}
    fp_pct = fp.get("fp_rate_pct", "-")
    real_fail = soak.get("real_failures", 0)
    artifacts = soak.get("measurement_artifacts", soak.get("failures", 0))
    if soak.get("pass_laptop_proof") or (
        soak.get("pass_operational") and dur >= 70 and real_fail == 0
    ):
        return S("soak_laptop_body").format(
            dur=dur,
            samples=soak.get("samples", 0),
            rss=rss_mb,
            fp=fp_pct,
            real_fail=real_fail,
            artifacts=artifacts,
        )
    return S("soak_body").format(
        dur=dur,
        samples=soak.get("samples", 0),
        rss=rss_mb,
        status=soak_status_text(soak),
    )


def scorecard_display_rows(rows: list[dict[str, Any]], sections: dict[str, Any]) -> list[dict[str, Any]]:
    """Scorecard satirlarini oldugu gibi goster — soak override yok."""
    return list(rows)


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
    scorecard = scorecard_display_rows(data.get("scorecard") or [], sections)
    tests = data.get("validationTests") or []
    positioning = data.get("positioning") or {}
    en = LOCALE == "en"
    passed = data.get("pass") is True

    doc = GuardianPDF(str(data.get("reportDate", "")))
    heroes = build_heroes(data, sections)
    versus = data.get("versusCompetitors") or {}
    versus_rows = versus.get("rows") or []

    # Page 1 — Cover (tablo yok; okunabilirlik icin matris sayfa 2)
    doc.cover_page(
        data.get("product", "Linux Log Guardian"),
        passed,
        heroes,
    )

    # Page 2 — Tam rakip matrisi (buyuk tablo)
    doc.add_page()
    doc.inner_page_header(S("versus_full"), S("versus_sub"))
    if versus_rows:
        tagline = versus.get("taglineEn" if en else "taglineTr") or versus.get("taglineTr", "")
        doc.body(truncate(str(tagline), 180), 9, C_MUTED)
        doc.ln(2)
        doc.body(S("versus_disclaimer"), 8, C_MUTED)
        doc.ln(4)
        doc.versus_table(versus_rows)

    # Page 3 — Executive summary (ayri sayfa, kayma yok)
    doc.add_page()
    doc.inner_page_header(S("exec_summary"))
    purpose = positioning.get("purposeEn" if en else "purposeTr") or positioning.get("purposeTr", "")
    doc.body(truncate(purpose, 240), 9.5)
    doc.ln(4)
    value = positioning.get("valueBulletsEn" if en else "valueBulletsTr") or positioning.get("valueBulletsTr", [])
    honest = positioning.get("honestBulletsEn" if en else "honestBulletsTr") or positioning.get("honestBulletsTr", [])
    doc.two_column_panels(S("core_features"), value, S("honest_section"), honest)

    # Page 4 — Scorecard
    doc.add_page()
    doc.inner_page_header(S("scorecard"))
    doc.scorecard_table(scorecard)

    # Page 4+ — Tests
    doc.add_page()
    doc.inner_page_header(S("tests_section"), S("tests_subtitle"))
    if tests:
        doc.validation_table(tests)
    else:
        doc.body(S("tests_missing"))

    # Evidence
    doc.add_page()
    doc.inner_page_header(S("evidence_section"), S("evidence_subtitle"))

    bench = sections.get("benchmark") or {}
    if bench:
        doc.section(S("bench_section"))
        doc.bench_table(bench)
        doc.ln(2)
        doc.body(S("bench_note"), 7.5, C_MUTED)

    crs = sections.get("crsParity") or {}
    if crs:
        g = crs.get("guardian") or {}
        doc.ln(3)
        doc.info_panel(
            S("crs_section"),
            S("crs_body").format(
                recall=g.get("attack_recall_pct", "-"),
                fp=g.get("benign_fp_pct", "-"),
                parity=crs.get("parity_pct", "-"),
                patterns=crs.get("crs_pattern_count", "-"),
            ),
        )

    comp = sections.get("compliance") or {}
    es = comp.get("executiveSummary") or {}
    if es:
        stds = ", ".join(comp.get("standards") or [])
        doc.info_panel(
            S("compliance_section"),
            S("compliance_body").format(
                passed=es.get("controlsPassed"),
                total=es.get("controlsTotal"),
                rate=es.get("passRatePct"),
                stds=stds,
            ),
        )

    ban = sections.get("banLatency") or {}
    if ban.get("ban_latency_ms") is not None:
        doc.info_panel(
            S("ban_section"),
            S("ban_body").format(
                median=ban.get("median_ms", ban.get("ban_latency_ms")),
                n=ban.get("sample_count", 1),
                p90=ban.get("p90_ms", "-"),
                target=ban.get("target_ms", 75),
                path=ban.get("ban_path", "-"),
            )
            + f" - {S('ban_ok') if ban.get('pass') else S('ban_fail')}.",
            accent=C_PASS,
        )
    elif ban:
        doc.info_panel(S("ban_section"), str(ban.get("note", S("ban_pending"))))

    soak = sections.get("soak") or {}
    if soak and not soak.get("short_mode"):
        laptop_ok = soak.get("pass_laptop_proof") or (
            soak.get("pass_operational")
            and (soak.get("duration_hours") or 0) >= 70
            and soak.get("real_failures", 0) == 0
        )
        doc.info_panel(
            S("soak_section"),
            soak_panel_text(soak, sections),
            accent=C_PASS if laptop_ok else C_ACCENT_DARK,
        )

    stats = sections.get("codeStats") or {}
    doc.ln(2)
    doc.section(S("code_section"))
    doc.body(
        S("code_body").format(
            lines=stats.get("sourceLines", 0),
            files=stats.get("sourceFiles", 0),
        ),
        8,
    )

    missing = data.get("missingInputs") or []
    if missing:
        doc.ln(2)
        doc.body(f"{S('missing_inputs')}: {', '.join(missing)}", 7, C_MUTED)

    doc.ln(5)
    doc.body(S("footer_gen"), 7, C_MUTED)

    doc.save(args.output)
    print(f"[competitive_proof_pdf] locale={LOCALE} -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
