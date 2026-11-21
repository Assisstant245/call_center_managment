import { ForbiddenException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./security/current-user.decorator";

/**
 * Finds the agent profile that belongs to a logged-in user
 * (linked by userId, or by matching e-mail address).
 */
export async function findAgentForUser(prisma: PrismaService, user: AuthUser) {
  return prisma.agent.findFirst({
    where: { OR: [{ userId: user.sub }, { email: user.email }] },
  });
}

export async function requireAgentForUser(
  prisma: PrismaService,
  user: AuthUser,
) {
  const agent = await findAgentForUser(prisma, user);
  if (!agent) {
    throw new ForbiddenException(
      "No agent profile is linked to your account. Ask a manager to create one with your e-mail address.",
    );
  }
  return agent;
}
