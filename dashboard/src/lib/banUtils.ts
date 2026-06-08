export const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/** Attack tree NET_CONNECT detail → ban adayı IPv4 */
export function ipFromConnectDetail(detail?: string): string | null {
  if (!detail) return null;
  const ip = detail.split(":")[0]?.trim();
  return ip && IPV4_RE.test(ip) ? ip : null;
}

export function collectBanIpsFromTree(events?: { type?: string; detail?: string }[]): string[] {
  const ips = new Set<string>();
  for (const ev of events ?? []) {
    if (ev.type === "NET_CONNECT") {
      const ip = ipFromConnectDetail(ev.detail);
      if (ip) ips.add(ip);
    }
  }
  return [...ips];
}
