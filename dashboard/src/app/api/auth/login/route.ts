import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SignJWT } from 'jose';
import { getJwtSecret } from '@/lib/authSecrets';
import { verifyPassword } from '@/lib/password';
import { checkLoginRateLimit, loginRateLimitKey } from '@/lib/loginRateLimit';

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

    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      tenantId: user.tenantId,
      isAdmin: user.isAdmin,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(getJwtSecret());

    const response = NextResponse.json({ success: true, redirect: '/' });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
