"use client";

import { useState } from "react";
import { Check, Clipboard } from "lucide-react";

interface TerminalBlockProps {
  command: string;
  comment?: string;
  label?: string;
  copy?: boolean;
  className?: string;
  /** Optional expected output rendered below the command, dimmed. */
  output?: string;
}

/**
 * Mac-window styled shell block with light "syntax" coloring + optional copy.
 * Lightweight (no shiki bundle) but visually high fidelity.
 */
export default function TerminalBlock({
  command,
  comment,
  label = "SHELL",
  copy = false,
  className = "",
  output,
}: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 font-mono text-xs shadow-xl transition-all duration-300 hover:border-slate-700 ${className}`}
    >
      {/* scanline accent */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <div className="h-8 w-full animate-scanline bg-gradient-to-b from-transparent via-emerald-400 to-transparent" />
      </div>

      <div className="absolute right-0 top-0 select-none p-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div className="mb-2 flex select-none items-center gap-2 border-b border-slate-900 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
        {copy && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy command"
            className="ml-auto rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-all hover:bg-slate-800/60 hover:text-white active:scale-95"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.5} />
            ) : (
              <Clipboard className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>

      <div className="space-y-1">
        {comment && <p className="select-none text-slate-500"># {comment}</p>}
        <p className="whitespace-pre-wrap break-words text-slate-200">
          <span className="mr-2 select-none text-blue-500">$</span>
          {command}
        </p>
        {output && (
          <pre className="mt-2 select-none whitespace-pre-wrap border-t border-slate-900 pt-2 text-[11px] leading-relaxed text-slate-500">
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}
