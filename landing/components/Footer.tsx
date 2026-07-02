"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy, brandName } from "@/lib/i18n/copy";

export default function Footer() {
  const { locale } = useI18n();
  const { footer, contact } = getCopy(locale);
  const name = brandName(locale);

  return (
    <footer className="border-t border-neutral-900 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-mono text-sm font-bold tracking-wide text-white">
              {name}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              {footer.desc}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span className="font-mono text-[10px] text-neutral-500">
                {footer.soak}
              </span>
            </div>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => {
                  const isExternal = link.href.startsWith("http");
                  const lastSeg = link.href.split("/").pop() ?? "";
                  const isFile = lastSeg.includes(".");
                  const cls =
                    "text-sm text-neutral-500 transition-colors hover:text-white";
                  return (
                    <li key={link.label}>
                      {isExternal || isFile ? (
                        <a
                          href={link.href}
                          className={cls}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={cls}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-neutral-900 pt-8 md:flex-row">
          <p className="font-mono text-xs text-neutral-600">
            © {new Date().getFullYear()} {footer.copyPrefix} ·{" "}
            <a
              href={footer.licenseHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 transition-colors hover:text-neon"
            >
              MIT
            </a>{" "}
            · {footer.copySuffix}
          </p>
          <p className="text-center font-mono text-xs text-neutral-600 md:text-right">
            {contact.email}
          </p>
        </div>
      </div>
    </footer>
  );
}
