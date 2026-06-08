import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'crypto';

const SCRYPT_PREFIX = 'scrypt:';

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${SCRYPT_PREFIX}${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith(SCRYPT_PREFIX)) {
    const rest = stored.slice(SCRYPT_PREFIX.length);
    const sep = rest.indexOf(':');
    if (sep <= 0) return false;
    const saltHex = rest.slice(0, sep);
    const hashHex = rest.slice(sep + 1);
    try {
      const salt = Buffer.from(saltHex, 'hex');
      const expected = Buffer.from(hashHex, 'hex');
      const actual = scryptSync(password, salt, expected.length);
      return (
        expected.length === actual.length &&
        timingSafeEqual(expected, actual)
      );
    } catch {
      return false;
    }
  }
  /* Legacy SHA-256 (dev migration) */
  const legacy = createHash('sha256').update(password).digest('hex');
  return legacy === stored;
}
