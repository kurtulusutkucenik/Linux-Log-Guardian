"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function EvidencePack() {
  const { locale } = useI18n();
  const EVIDENCE = getCopy(locale).evidence;
  const [copied, setCopied] = useState<"pack" | "demo" | null>(null);

  const copyCmd = async (text: string, key: "pack" | "demo") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id="kanit" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
          {EVIDENCE.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
          {EVIDENCE.title}
        </h2>
        <p className="mt-6 font-mono text-sm text-neutral-500">{EVIDENCE.note}</p>
        <div className="mt-6 rounded-lg border border-neutral-800 bg-black/50 p-4 text-left font-mono text-xs text-neutral-400">
          <p className="text-neutral-500"># Tek komut — rakiplerde yok</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-neon">{EVIDENCE.fullPackCmd}</p>
            <button
              type="button"
              onClick={() => void copyCmd(EVIDENCE.fullPackCmd, "pack")}
              className="rounded border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400 hover:border-neon hover:text-neon"
            >
              {copied === "pack" ? "✓" : "copy"}
            </button>
          </div>
          <p className="mt-3 text-neutral-500"># 3 dk demo</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-cyan">{EVIDENCE.demoCmd}</p>
            <button
              type="button"
              onClick={() => void copyCmd(EVIDENCE.demoCmd, "demo")}
              className="rounded border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400 hover:border-cyan hover:text-cyan"
            >
              {copied === "demo" ? "✓" : "copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {EVIDENCE.files.map((file) => {
          const isPdf = file.endsWith(".pdf");
          const href = isPdf ? "/evidence/competitive-proof.pdf" : undefined;
          const Wrapper = href ? "a" : "div";
          return (
            <Wrapper
              key={file}
              {...(href
                ? { href, target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`flex items-center gap-2.5 rounded-lg border border-neutral-800 bg-panel-alt p-4 transition-all ${
                href ? "hover:border-neon" : "hover:border-neutral-700"
              }`}
            >
              <svg
                className={`h-4 w-4 shrink-0 ${isPdf ? "text-neon" : "text-neutral-600"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="truncate font-mono text-[11px] text-neutral-400">
                {file}
              </span>
            </Wrapper>
          );
        })}
      </div>

      <p className="mt-8 text-center font-mono text-xs text-neutral-600">
        {EVIDENCE.update}
      </p>
    </section>
  );
}
