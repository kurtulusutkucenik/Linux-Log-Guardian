"use client";

import { useEffect, useState } from "react";

export function PdfEmbed({ src }: { src: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl: string | null = null;
    fetch(src, { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "PDF yuklenemedi"));

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (err) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-white/70">
        <p>PDF onizleme acilamadi: {err}</p>
        <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          PDF yeni sekmede ac
        </a>
      </div>
    );
  }

  if (!url) {
    return <div className="flex-1 flex items-center justify-center text-white/40">PDF yukleniyor…</div>;
  }

  return (
    <iframe
      title="Competitive Proof PDF"
      src={url}
      className="flex-1 w-full min-h-0 border-0 bg-white"
    />
  );
}
