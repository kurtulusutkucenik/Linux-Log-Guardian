"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Telegram deep-link: /incidents/INC-… → ana sayfa incident modali */
export default function IncidentDeepLinkPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (!id) {
      router.replace("/");
      return;
    }
    router.replace(`/?incident=${encodeURIComponent(id)}`);
  }, [id, router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-white/60 text-sm">
      Incident yükleniyor…
    </main>
  );
}
