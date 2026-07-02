import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TestMatrix from "@/components/sections/TestMatrix";
import Footer from "@/components/Footer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Tests — Linux Log Guardian | Validation Matrix",
  description:
    "Linux Log Guardian automated validation matrix: install gates, OWASP CRS parity, false positives, ban latency, corpus recall, and 72h soak — measured proof.",
  path: "/tests/",
});

export default function TestsPage() {
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
