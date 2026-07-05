import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n/locales";

export const SITE_URL = "https://ceniklinuxlogguardian.org";
export const SITE_NAME = "Linux Log Guardian";

/** Static export routes (trailingSlash: true in next.config) */
export const PUBLIC_PATHS = ["/", "/paketler/", "/testler/", "/tests/"] as const;

export type PublicPath = (typeof PUBLIC_PATHS)[number];

const DEFAULT_DESCRIPTION =
  "Open-source (MIT) self-hosted security. nginx access log → OWASP CRS/WAF → ~20 ms kernel ban. Single chain, 76 automated tests, 72h soak PASS.";

export function hreflangCode(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : locale;
}

export function absoluteUrl(path: PublicPath | string): string {
  if (path === "/") return `${SITE_URL}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p.endsWith("/") ? p : `${p}/`}`;
}

export function buildLanguageAlternates(path: PublicPath | string): Metadata["alternates"] {
  const url = absoluteUrl(path);
  const languages: Record<string, string> = { "x-default": url };
  for (const { code } of LOCALES) {
    languages[hreflangCode(code)] = url;
  }
  return { canonical: url, languages };
}

export function buildPageMetadata(opts: {
  title: string;
  description?: string;
  path: PublicPath | string;
}): Metadata {
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: buildLanguageAlternates(opts.path),
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — nginx log → WAF → kernel ban`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: ["/og.svg"],
    },
    robots: { index: true, follow: true },
  };
}

export const HOME_METADATA: Metadata = {
  ...buildPageMetadata({
    title: "Linux Log Guardian | nginx log → WAF → kernel ban",
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Linux",
  description: DEFAULT_DESCRIPTION,
  url: `${SITE_URL}/`,
  downloadUrl: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian",
  license: "https://opensource.org/licenses/MIT",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
} as const;
