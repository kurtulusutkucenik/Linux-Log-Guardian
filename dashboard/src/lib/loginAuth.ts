import { SignJWT } from 'jose';
import { prisma } from '@/lib/db';
import { getJwtSecret } from '@/lib/authSecrets';
import { verifyPassword } from '@/lib/password';

export type AuthUser = {
  id: string;
  username: string;
  tenantId: string;
  isAdmin: boolean;
};

export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthUser | null> {
  if (!username || !password) return null;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;

  return {
    id: user.id,
    username: user.username,
    tenantId: user.tenantId,
    isAdmin: user.isAdmin,
  };
}

export async function signAuthToken(user: AuthUser): Promise<string> {
  const ttl = process.env.DASHBOARD_JWT_EXPIRY?.trim() || '24h';
  return new SignJWT({
    userId: user.id,
    username: user.username,
    tenantId: user.tenantId,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(ttl)
    .sign(getJwtSecret());
}

export function authCookieSecure(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  return process.env.COOKIE_SECURE !== '0';
}
