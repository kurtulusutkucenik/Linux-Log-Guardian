"use client";

import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { ValidationTestsPanel } from "@/components/ValidationTestsPanel";
import { useLanguage } from "@/components/LanguageProvider";

export default function TestsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="glass-panel p-6 border-b border-white/10 flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0"
          aria-label={t("testsBackHome")}
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </Link>
        <div className="flex items-start gap-3 min-w-0">
          <FlaskConical className="w-7 h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {t("testsPageTitle")}
            </h1>
            <p className="text-sm text-white/50 mt-1">{t("testsPageSubtitle")}</p>
          </div>
        </div>
      </header>

      <ValidationTestsPanel compact={false} />

      <p className="text-xs text-white/30 text-center pb-4">{t("testsRefreshHint")}</p>
    </div>
  );
}
