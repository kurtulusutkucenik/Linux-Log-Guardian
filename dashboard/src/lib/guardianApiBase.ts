/** Host log-guardian REST API — varsayilan :8090 (install.sh API_PORT). */
export function guardianApiBase(): string {
  const raw =
    process.env.GUARDIAN_BAN_URL?.trim() ||
    process.env.GUARDIAN_API_URL?.trim() ||
    "http://127.0.0.1:8090";
  return raw.replace(/\/$/, "");
}
