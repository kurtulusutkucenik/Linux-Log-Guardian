import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { isEnterpriseRoute, isProRoute, tierAtLeast } from '@/lib/tier';
import { getJwtSecret } from '@/lib/authSecrets';

const PUBLIC_FILE = /\.(svg|png|jpe?g|gif|webp|ico)$/i;

export async function middleware(request: NextRequest) {
  if (PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  /* C agent: Bearer API key (route handler dogrular); JWT cookie gerekmez */
  const isAgentBearerApi =
    request.nextUrl.pathname === '/api/fleet/commands' ||
    request.nextUrl.pathname === '/api/fleet/commands/ack';
  const isDataRoomApi = request.nextUrl.pathname.startsWith('/api/data-room/');
  const isPublicPage = request.nextUrl.pathname === '/competitive-proof';
  const isPublicApi =
    request.nextUrl.pathname === '/api/auth/login' ||
    request.nextUrl.pathname === '/api/telemetry' ||
    request.nextUrl.pathname === '/api/tier' ||
    request.nextUrl.pathname === '/api/metrics/live' ||
    request.nextUrl.pathname === '/api/metrics/grafana' ||
    isDataRoomApi ||
    isAgentBearerApi;

  const pathname = request.nextUrl.pathname;

  function tierBlocked(required: 'pro' | 'enterprise') {
    if (required === 'enterprise' && !tierAtLeast('enterprise')) {
      return NextResponse.json(
        {
          error: 'Enterprise tier required',
          tier: process.env.LOG_GUARDIAN_TIER || 'community',
          hint: 'Set LOG_GUARDIAN_TIER=enterprise',
        },
        { status: 403 }
      );
    }
    if (required === 'pro' && !tierAtLeast('pro')) {
      return NextResponse.json(
        {
          error: 'Pro tier required',
          tier: process.env.LOG_GUARDIAN_TIER || 'community',
          hint: 'Set LOG_GUARDIAN_TIER=pro for fleet + compliance',
        },
        { status: 403 }
      );
    }
    return null;
  }

  if (isEnterpriseRoute(pathname)) {
    const blocked = tierBlocked('enterprise');
    if (blocked) {
      if (isApiRoute) return blocked;
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }
  }

  if (isProRoute(pathname)) {
    const blocked = tierBlocked('pro');
    if (blocked) {
      if (isApiRoute) return blocked;
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }
  }

  if (!token) {
    if (isLoginPage || isPublicApi || isPublicPage) return NextResponse.next();
    // API request without token -> 401
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Web request without token -> redirect to /login
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    
    // Zaten login sayfasındaysa ve token geçerliyse, ana sayfaya yönlendir.
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // Token geçerli. Headers'a tenantId bilgisini enjekte et.
    // Dashboard API'leri (fleet, tenants vs.) bu header'ı okuyacak.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Tenant', payload.tenantId as string);
    requestHeaders.set('X-User-Role', payload.isAdmin ? 'admin' : 'user');
    
    // Eğer kullanıcı admin DEĞİLSE, request.headers'da gelen 'x-tenant-id' filtresini
    // ezip zorla kendi tenant_id'sini ayarlayalım (Güvenlik Kalkanı)
    if (!payload.isAdmin) {
      requestHeaders.set('X-Tenant-Id', payload.tenantId as string);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    // Geçersiz token
    if (isLoginPage || isPublicApi || isPublicPage) return NextResponse.next();
    if (isApiRoute) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpe?g|gif|webp|ico)$).*)',
  ],
};
