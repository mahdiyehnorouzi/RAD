import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthedRequest } from "../session.middleware";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (!request.userId) throw new UnauthorizedException("برای این کار باید وارد شوید.");
    const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
    if (!user?.adminRole || user.status !== "active") {
      throw new ForbiddenException("دسترسی مدیریت ندارید.");
    }
    request.adminRole = user.adminRole;
    return true;
  }
}
