/** Host log-guardian :8090 — API_TOKEN (read) + API_MUTATION_TOKEN (POST, opsiyonel). */

export function guardianApiReadToken(): string | undefined {
  return process.env.GUARDIAN_API_TOKEN?.trim() || undefined;
}

export function guardianApiMutationToken(): string | undefined {
  return (
    process.env.GUARDIAN_API_MUTATION_TOKEN?.trim() ||
    process.env.GUARDIAN_API_TOKEN?.trim() ||
    undefined
  );
}

export function guardianApiAuthHeaders(): HeadersInit {
  const tok = guardianApiReadToken();
  if (!tok) return {};
  return { Authorization: `Bearer ${tok}` };
}

export function guardianApiMutationHeaders(): HeadersInit {
  const tok = guardianApiMutationToken();
  if (!tok) return {};
  return { Authorization: `Bearer ${tok}` };
}
