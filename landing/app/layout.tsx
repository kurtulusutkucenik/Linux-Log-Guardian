import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontDisplay, fontBody } from "./fonts";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import JsonLd from "@/components/JsonLd";
import CloudflareAnalytics from "@/components/CloudflareAnalytics";
import { HOME_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...HOME_METADATA,
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  keywords: [
    "nginx WAF",
    "fail2ban alternative",
    "OWASP CRS",
    "kernel ban",
    "ipset",
    "eBPF",
    "self-hosted security",
    "Linux Log Guardian",
    "log guardian",
  ],
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
        <JsonLd />
        <I18nProvider>
          <div className="relative z-10">{children}</div>
        </I18nProvider>
        <CloudflareAnalytics />
      </body>
    </html>
  );
}
