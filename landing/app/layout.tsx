import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontDisplay, fontBody } from "./fonts";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata: Metadata = {
  title: "Linux Log Guardian | nginx log → WAF → kernel ban",
  description:
    "Open-source (MIT) self-hosted security software. nginx access log → OWASP CRS/WAF → ~17 ms kernel ban. Single chain, 75 automated tests, 72h soak PASS.",
  metadataBase: new URL("https://ceniklinuxlogguardian.org"),
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Linux Log Guardian",
    description:
      "nginx log → WAF/CRS → ~17 ms kernel ban. Single chain, self-hosted, MIT.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body className="relative min-h-screen bg-pitch font-sans antialiased selection:bg-neon/20 selection:text-white">
        <I18nProvider>
          <div className="relative z-10">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
