import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { User } from "../database/entities";
import { toAuthUser, type Actor } from "../common/identity";
import { normalizeProfileName, normalizeProfilePhone } from "./profile-input";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /**
   * Updates the session user's name and contact mobile.
   * The user id always comes from the verified session, never the body.
   * Email, password, and role are not writable here. Order rows are not
   * touched; checkout keeps the address snapshot it stored at purchase.
   */
  async update(actor: Actor, input: { name: string; phone?: string | null }) {
    if (!actor.user) {
      throw new UnauthorizedException({
        message: "ابتدا وارد حساب شوید.",
        code: "auth_required",
      });
    }

    const user = await this.users.findOne({ where: { id: actor.user.id } });
    if (!user) {
      throw new UnauthorizedException({
        message: "ابتدا وارد حساب شوید.",
        code: "auth_required",
      });
    }

    const name = normalizeProfileName(input.name);
    if (!name) {
      throw new BadRequestException({
        message:
          input.name.trim().length > 80
            ? "نام نباید بیشتر از ۸۰ نویسه باشد."
            : "نام باید حداقل ۲ نویسه باشد.",
        code: "name_invalid",
      });
    }

    const phone = normalizeProfilePhone(input.phone);
    if (phone.present && phone.phone === undefined) {
      throw new BadRequestException({
        message: "شماره موبایل ایرانی معتبر وارد کنید.",
        code: "phone_invalid",
      });
    }

    if (phone.present && phone.phone) {
      const taken = await this.users.findOne({ where: { phone: phone.phone } });
      if (taken && taken.id !== user.id) {
        throw new ConflictException({
          message: "این شماره موبایل قبلاً برای حساب دیگری ثبت شده است.",
          code: "phone_taken",
        });
      }
    }

    const patch: { name: string; phone?: string | null } = { name };
    if (phone.present) patch.phone = phone.phone;

    try {
      await this.users.update({ id: user.id }, patch);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          message: "این شماره موبایل قبلاً برای حساب دیگری ثبت شده است.",
          code: "phone_taken",
        });
      }
      throw error;
    }

    const fresh = await this.users.findOne({ where: { id: user.id } });
    if (!fresh) {
      throw new UnauthorizedException({
        message: "ابتدا وارد حساب شوید.",
        code: "auth_required",
      });
    }
    return { user: toAuthUser(fresh) };
  }
}

function isUniqueViolation(error: unknown) {
  if (!(error instanceof QueryFailedError)) return false;
  const code =
    (
      error as QueryFailedError & {
        code?: string;
        driverError?: { code?: string };
      }
    ).driverError?.code ?? (error as { code?: string }).code;
  return code === "23505";
}
