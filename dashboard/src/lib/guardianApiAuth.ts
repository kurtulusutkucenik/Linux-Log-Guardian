/** Host log-guardian :8090 — API_TOKEN (read + write). */

export function guardianApiAuthHeaders(): HeadersInit {
  const tok = process.env.GUARDIAN_API_TOKEN?.trim();
  if (!tok) return {};
  return { Authorization: `Bearer ${tok}` };
}
