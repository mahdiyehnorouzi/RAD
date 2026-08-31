import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthedRequest } from "../session.middleware";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    if (!request.userId) throw new UnauthorizedException("برای این کار باید وارد شوید.");
    return true;
  }
}
