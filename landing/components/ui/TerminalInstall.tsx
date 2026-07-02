"use client";

import { useCallback, useState } from "react";
import { HERO } from "@/lib/content";

const CMD = HERO.quickstart.join("\n");

const OUTPUT_LINES = [
  { text: "[OK] log-guardian.service active", color: "text-ok" },
  { text: "[OK] daemon IPC: OK", color: "text-ok" },
  { text: "[OK] API fail-closed (tokensiz 403)", color: "text-cyan" },
  { text: "FAIL: 0   WARN: 0", color: "text-ok" },
];

export default function TerminalInstall() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <div
      className="overflow-hidden rounded-lg border border-neutral-800 bg-black shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-neutral-800 bg-panel px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-neutral-500">
          root@prod-node — bash
        </span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto rounded border border-neutral-700 px-2 py-0.5 font-mono text-[10px] text-neutral-400 transition-colors hover:border-neon hover:text-neon"
        >
          {copied ? "Kopyalandı!" : "Kopyala"}
        </button>
      </div>
      <div className="space-y-1.5 p-4 font-mono text-xs leading-relaxed">
        {HERO.quickstart.map((line) => (
          <p key={line} className="text-neutral-300">
            <span className="select-none text-neon">$</span> {line}
          </p>
        ))}
        <div className="pt-2" />
        {OUTPUT_LINES.map((line) => (
          <p key={line.text} className={line.color}>
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}
