import Script from "next/script";

/** Optional — set NEXT_PUBLIC_CF_BEACON in .env or Cloudflare Pages env vars */
const TOKEN = process.env.NEXT_PUBLIC_CF_BEACON?.trim();

export default function CloudflareAnalytics() {
  if (!TOKEN) return null;
  return (
    <Script
      id="cf-beacon"
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: TOKEN })}
    />
  );
}
