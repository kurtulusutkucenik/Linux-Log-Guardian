/** Redirect/cookie icin gercek istemci origin (next dev -H 0.0.0.0 tuzagi). */
export function requestOrigin(request: Request): string {
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim();
  const reqUrl = new URL(request.url);
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    reqUrl.protocol.replace(':', '');

  if (host && !host.startsWith('0.0.0.0')) {
    return `${proto}://${host}`;
  }

  if (reqUrl.hostname === '0.0.0.0' && host) {
    return `${proto}://${host}`;
  }

  return reqUrl.origin;
}

export function requestUrl(request: Request, path: string): URL {
  return new URL(path, requestOrigin(request));
}
