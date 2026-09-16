import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../database/entities";
import type { AuthedRequest } from "../session.middleware";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (!request.userId) throw new UnauthorizedException("برای این کار باید وارد شوید.");
    const user = await this.users.findOne({ where: { id: request.userId } });
    if (!user?.adminRole || user.status !== "active") {
      throw new ForbiddenException("دسترسی مدیریت ندارید.");
    }
    request.adminRole = user.adminRole;
    return true;
  }
}
