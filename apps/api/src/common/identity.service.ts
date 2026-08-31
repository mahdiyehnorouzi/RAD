import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ownerKey, toAuthUser, type Actor } from "../common/identity";
import type { AuthedRequest } from "../common/session.middleware";

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async fromRequest(request: AuthedRequest): Promise<Actor> {
    if (request.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: request.userId },
      });
      if (user) return { user: toAuthUser(user), guestId: request.guestId };
    }
    return { user: null, guestId: request.guestId };
  }

  key(actor: Actor) {
    return ownerKey(actor);
  }
}
