/** Fleet komut POST dogrulama — ban hattina dokunmaz, kuyruk guvenligi. */

const ALLOWED_TYPES = new Set([
  "BAN_IP",
  "UNBAN_IP",
  "PUSH_WAF_RULE",
  "PUSH_THREAT_FEED",
  "PUSH_CONFIG",
  "PUSH_SCHEMA",
  "PUSH_WASM_PLUGIN",
]);

const MAX_PAYLOAD_LEN = 4096;
const MAX_AGENT_ID_LEN = 128;
const IP_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

export type FleetCommandInput = {
  commandType?: unknown;
  payload?: unknown;
  targetAgentId?: unknown;
};

export function validateFleetCommand(body: FleetCommandInput): string | null {
  const commandType = String(body.commandType ?? "").trim();
  if (!commandType || !ALLOWED_TYPES.has(commandType)) {
    return `invalid commandType: ${commandType || "(empty)"}`;
  }

  const payloadRaw =
    typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload ?? "");
  if (!payloadRaw || payloadRaw.length > MAX_PAYLOAD_LEN) {
    return "payload missing or too large";
  }

  if (commandType === "BAN_IP" || commandType === "UNBAN_IP") {
    const ip = payloadRaw.trim();
    if (!IP_RE.test(ip)) {
      return `invalid IP for ${commandType}`;
    }
  }

  if (body.targetAgentId != null && body.targetAgentId !== "") {
    const aid = String(body.targetAgentId);
    if (aid.length > MAX_AGENT_ID_LEN || !/^[\w.-]+$/.test(aid)) {
      return "invalid targetAgentId";
    }
  }

  return null;
}
