"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/locales";

// DOM sırasıyla birebir aynı olmalı (deterministik konum tespiti için).
const SECTION_IDS = [
  "hero",
  "nedir",
  "birlesim",
  "sayilar",
  "pipeline",
  "secili",
  "neden",
  "rakipler",
  "grafikler",
  "dogrusinir",
  "proof",
  "kurulum",
  "kanit",
  "iletisim",
] as const;

// Her dil için 14 kısa etiket (SECTION_IDS ile aynı sıra).
const LABELS: Partial<Record<Locale, string[]>> = {
  tr: ["Ana", "Nedir", "3 Paket", "Sayılar", "Pipeline", "Seçili", "Neden", "Rakip", "Grafik", "Sınır", "Proof", "Kurulum", "Kanıt", "İletişim"],
  en: ["Home", "About", "3 Packs", "Numbers", "Pipeline", "Selected", "Why", "Rivals", "Charts", "Limits", "Proof", "Setup", "Evidence", "Contact"],
  de: ["Start", "Über", "3 Pakete", "Zahlen", "Pipeline", "Auswahl", "Warum", "Rivalen", "Grafik", "Grenzen", "Proof", "Setup", "Nachweis", "Kontakt"],
  fr: ["Accueil", "À propos", "3 Packs", "Chiffres", "Pipeline", "Sélection", "Pourquoi", "Rivaux", "Graphes", "Limites", "Preuve", "Install.", "Dossier", "Contact"],
  es: ["Inicio", "Qué es", "3 Packs", "Números", "Pipeline", "Selección", "Por qué", "Rivales", "Gráficos", "Límites", "Prueba", "Instalar", "Evidencia", "Contacto"],
  pt: ["Início", "Sobre", "3 Packs", "Números", "Pipeline", "Seleção", "Porquê", "Rivais", "Gráficos", "Limites", "Prova", "Instalar", "Evidência", "Contacto"],
  nl: ["Home", "Over", "3 Packs", "Cijfers", "Pipeline", "Selectie", "Waarom", "Rivalen", "Grafiek", "Grenzen", "Proof", "Setup", "Bewijs", "Contact"],
  ru: ["Главная", "О нас", "3 пакета", "Цифры", "Pipeline", "Выбор", "Почему", "Соперники", "Графики", "Границы", "Proof", "Установка", "Док-во", "Контакт"],
  zh: ["首页", "简介", "3 套件", "数据", "流程", "精选", "为何", "对手", "图表", "边界", "验证", "安装", "证据", "联系"],
  ja: ["ホーム", "概要", "3 パック", "数値", "パイプ", "抜粋", "理由", "競合", "グラフ", "境界", "証明", "設定", "証拠", "連絡"],
  ko: ["홈", "소개", "3 팩", "수치", "파이프", "선택", "이유", "경쟁", "차트", "한계", "증명", "설치", "증거", "연락"],
  ar: ["الرئيسية", "نبذة", "3 حزم", "أرقام", "خط", "مختار", "لماذا", "المنافسون", "رسوم", "حدود", "إثبات", "تثبيت", "دليل", "اتصال"],
};

const TURKIC: Locale[] = ["tr", "az", "kk", "uz", "ky", "tk", "ug", "tt", "ba", "cv", "crh", "gag", "sah"];

function labelsFor(locale: Locale): string[] {
  return LABELS[locale] ?? (TURKIC.includes(locale) ? LABELS.tr! : LABELS.en!);
}

export default function SectionNav() {
  const { locale } = useI18n();
  const labels = labelsFor(locale);
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Referans çizgisinin (viewport üst ~%35) üstünü geçen SON bölüm aktiftir.
    // "En son kesişen kayıt kazanır" mantığından farklı olarak deterministiktir:
    // kumanda her zaman ekrandaki gerçek bölümle uyuşur.
    const update = () => {
      setShow(window.scrollY > 400);
      const line = window.innerHeight * 0.35;
      let current = 0;
      for (let i = 0; i < SECTION_IDS.length; i++) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = i;
      }
      // Sayfa dibindeysek son bölümü kesin aktif yap (kısa footer kenar durumu).
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        current = SECTION_IDS.length - 1;
      }
      setIdx(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const go = (next: number) => {
    const i = Math.max(0, Math.min(SECTION_IDS.length - 1, next));
    const el = document.getElementById(SECTION_IDS[i]);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${SECTION_IDS[i]}`);
    }
  };

  if (!show) return null;

  return (
        <div
          className="fixed bottom-4 right-4 z-[80] flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-black/90 p-1.5 shadow-[0_0_24px_rgba(0,0,0,0.6)] backdrop-blur-md sm:bottom-6 sm:right-6 sm:p-2"
          aria-label="Bölüm gezintisi"
        >
      <button
        type="button"
        onClick={() => go(idx - 1)}
        disabled={idx === 0}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-25"
        aria-label="Önceki bölüm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className="px-1 font-mono text-[10px] tabular-nums text-neutral-500">
        {String(idx + 1).padStart(2, "0")}/{String(SECTION_IDS.length).padStart(2, "0")}
      </span>
      <span className="max-w-[72px] truncate px-1 text-center font-mono text-[9px] uppercase tracking-wider text-neon">
        {labels[idx]}
      </span>
      <button
        type="button"
        onClick={() => go(idx + 1)}
        disabled={idx === SECTION_IDS.length - 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-25"
        aria-label="Sonraki bölüm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
