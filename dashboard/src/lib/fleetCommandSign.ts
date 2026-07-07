import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

export type FleetCommandSignInput = {
  id: string;
  tenantId: string;
  commandType: string;
  payload: string;
  targetAgentId?: string | null;
};

const DEV_FLEET_HMAC_KEY = "log-guardian-fleet-command-dev-key";

export function fleetSignKey(): string | null {
  const key = (process.env.FLEET_COMMAND_HMAC_KEY || DEV_FLEET_HMAC_KEY).trim();
  if (!key || key.length < 16) return null;
  return key;
}

export function fleetRequireSig(): boolean {
  return (process.env.FLEET_COMMAND_REQUIRE_SIG ?? "1") !== "0";
}

export function buildFleetCommandDigest(input: FleetCommandSignInput): string {
  const target = input.targetAgentId ?? "";
  return `${input.id}|${input.tenantId}|${input.commandType}|${input.payload}|${target}`;
}

export function signFleetCommand(input: FleetCommandSignInput): string | null {
  const key = fleetSignKey();
  if (!key) return null;
  return createHmac("sha256", key).update(buildFleetCommandDigest(input)).digest("hex");
}

export function verifyFleetCommandSignature(
  cmd: FleetCommandSignInput & { signature?: string | null },
): boolean {
  const expected = cmd.signature?.trim();
  if (!expected) return !fleetRequireSig();

  const calc = signFleetCommand(cmd);
  if (!calc || calc.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(calc), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function createSignedFleetCommand(
  db: PrismaClient,
  data: Prisma.AgentCommandUncheckedCreateInput,
) {
  const command = await db.agentCommand.create({ data });
  const signature = signFleetCommand({
    id: command.id,
    tenantId: command.tenantId,
    commandType: command.commandType,
    payload: command.payload,
    targetAgentId: command.targetAgentId,
  });
  if (!signature) return command;
  return db.agentCommand.update({
    where: { id: command.id },
    data: { signature },
  });
}
