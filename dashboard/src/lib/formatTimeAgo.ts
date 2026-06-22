/** Relative time for fleet last-seen (client-side, no deps). */
export function formatTimeAgo(
  date: Date | string | number,
  locale = "tr",
): string {
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 48) return rtf.format(-hr, "hour");
  const day = Math.floor(hr / 24);
  return rtf.format(-day, "day");
}
