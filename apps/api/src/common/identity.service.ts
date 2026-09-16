import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../database/entities";
import { ownerKey, toAuthUser, type Actor } from "./identity";
import type { AuthedRequest } from "./session.middleware";

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async fromRequest(request: AuthedRequest): Promise<Actor> {
    if (request.userId) {
      const user = await this.users.findOne({ where: { id: request.userId } });
      if (user) return { user: toAuthUser(user), guestId: request.guestId };
    }
    return { user: null, guestId: request.guestId };
  }

  key(actor: Actor) {
    return ownerKey(actor);
  }
}
