"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAudioKernel } from "@/context/AudioKernelContext";

/**
 * Restrained ambient-sound control. Music is off by default (enterprise-calm);
 * the first click satisfies the browser gesture requirement and fades the
 * "Summer Piano" score in. A second click mutes.
 */
export default function AudioToggle() {
  const { started, muted, initialize, toggleMute } = useAudioKernel();
  const [busy, setBusy] = useState(false);
  const playing = started && !muted;

  const onClick = async () => {
    if (!started) {
      setBusy(true);
      await initialize();
      setBusy(false);
    } else {
      toggleMute();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Sesi kapat" : "Ambient müziği aç"}
      className="interactive fixed bottom-6 right-6 z-[85] hidden items-center gap-2.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 backdrop-blur-md transition-colors hover:border-white/25 md:flex"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {playing ? (
          <span className="flex items-end gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-white/80"
                style={{
                  height: 6 + i * 3,
                  animation: `lg-eq 900ms ease-in-out ${i * 120}ms infinite alternate`,
                }}
              />
            ))}
          </span>
        ) : busy ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white/80" />
        ) : muted ? (
          <VolumeX className="h-3.5 w-3.5 text-slate-300" strokeWidth={1.5} />
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-slate-300" strokeWidth={1.5} />
        )}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
        {playing ? "Ambient · açık" : "Ambient · kapalı"}
      </span>
    </button>
  );
}
