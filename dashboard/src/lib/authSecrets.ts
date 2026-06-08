/** JWT secret — production'da zorunlu (min 32 karakter). */

export function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!raw || raw.length < 32) {
      throw new Error(
        'JWT_SECRET required in production (minimum 32 characters)'
      );
    }
    return new TextEncoder().encode(raw);
  }
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  return new TextEncoder().encode('dev-only-insecure-jwt-secret-32chars!!');
}
