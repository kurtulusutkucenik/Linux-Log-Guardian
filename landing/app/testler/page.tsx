import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TestMatrix from "@/components/sections/TestMatrix";
import Footer from "@/components/Footer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Testler — Linux Log Guardian | Doğrulama Matrisi",
  description:
    "Linux Log Guardian otomatik test matrisi: kurulum kapıları, OWASP CRS parity, false positive, ban gecikmesi, corpus recall ve 72h soak — ölçülmüş kanıt.",
  path: "/testler/",
});

export default function TestlerPage() {
  return (
    <>
      <Navbar />
      <main>
        <TestMatrix />
      </main>
      <Footer />
    </>
  );
}
