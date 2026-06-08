import type { Metadata } from "next";
import { CompetitiveProofViewer } from "@/components/CompetitiveProofViewer";

export const metadata: Metadata = {
  title: "Competitive Proof | Linux Log Guardian",
  description: "Technical evidence brief — data room PDF (English)",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/favicon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function CompetitiveProofPage() {
  return <CompetitiveProofViewer />;
}
