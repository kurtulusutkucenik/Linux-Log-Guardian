"use client";

import { PdfEmbed } from "@/components/PdfEmbed";
import { useLanguage } from "@/components/LanguageProvider";
import { PROOF_PDF_FILENAME, proofPdfApiUrl } from "@/lib/pdfLocale";

export function CompetitiveProofViewer() {
  const { t } = useLanguage();
  const src = proofPdfApiUrl(true);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0a] print:hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-black/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/brand-logo-circle.png"
            alt="Linux Log Guardian"
            width={512}
            height={512}
            className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] object-contain shrink-0"
          />
          <span className="text-sm text-white/90 truncate">{t("competitiveProofTitle")}</span>
        </div>
        <a
          href={src}
          download={PROOF_PDF_FILENAME}
          className="text-xs text-primary hover:underline shrink-0"
        >
          {t("competitiveProofDownload")}
        </a>
      </header>
      <PdfEmbed src={src} />
    </div>
  );
}
