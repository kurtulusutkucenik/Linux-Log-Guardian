import { NextResponse } from 'next/server';
import {
  authenticateUser,
  authCookieSecure,
  signAuthToken,
} from '@/lib/loginAuth';
import { checkLoginRateLimit, loginRateLimitKey } from '@/lib/loginRateLimit';
import { requestUrl } from '@/lib/requestOrigin';

async function readCredentials(request: Request): Promise<{
  username: string;
  password: string;
  browserForm: boolean;
}> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    return {
      username: String(body?.username || ''),
      password: String(body?.password || ''),
      browserForm: false,
    };
  }

  const form = await request.formData();
  return {
    username: String(form.get('username') || ''),
    password: String(form.get('password') || ''),
    browserForm: true,
  };
}

function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: authCookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function POST(request: Request) {
  try {
    const rlKey = loginRateLimitKey(request);
    const rl = checkLoginRateLimit(rlKey);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts', retryAfterSec: rl.retryAfterSec },
        { status: 429 }
      );
    }

    const { username, password, browserForm } = await readCredentials(request);
    const user = await authenticateUser(username, password);

    if (!user) {
      if (browserForm) {
        return NextResponse.redirect(requestUrl(request, '/login?error=invalid'));
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAuthToken(user);

    if (browserForm) {
      const response = NextResponse.redirect(requestUrl(request, '/'));
      setAuthCookie(response, token);
      return response;
    }

    const response = NextResponse.json({ success: true, redirect: '/' });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
