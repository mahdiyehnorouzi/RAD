import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";
import type { Actor } from "../common/identity";
import { CustomerAddress, User } from "../database/entities";
import { parseAddressInput, type AddressDraftInput } from "./addresses.input";
import { toCustomerAddress } from "./addresses.mapper";
import { ADDRESS_BOOK_LIMIT } from "./const/limits";

const authRequired = {
  message: "ابتدا وارد حساب شوید.",
  code: "auth_required",
};

const notFound = {
  message: "این نشانی پیدا نشد.",
  code: "address_not_found",
};

@Injectable()
export class AddressesService implements OnModuleInit {
  constructor(
    @InjectRepository(CustomerAddress)
    private readonly addresses: Repository<CustomerAddress>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Production refuses schema sync, so a deploy of this API before
   * `1793600000000-AddCustomerAddressBook` would otherwise boot and then
   * 500 on every address request. Fail during module init instead.
   */
  async onModuleInit() {
    const [row] = await this.dataSource.query(
      `SELECT to_regclass('public."CustomerAddress"') AS present`,
    );
    if (!row?.present) {
      throw new Error(
        'Deployment refused: relation "CustomerAddress" does not exist. Apply migration 1793600000000-AddCustomerAddressBook before starting this API.',
      );
    }
  }

  async list(actor: Actor) {
    const userId = await this.existingUserId(actor);
    const rows = await ordered(this.addresses, userId);
    return { addresses: rows.map(toCustomerAddress) };
  }

  async create(
    actor: Actor,
    input: AddressDraftInput & { isDefault?: boolean },
  ) {
    const value = this.parse(input);
    return this.locked(actor, async (manager, userId) => {
      const repo = manager.getRepository(CustomerAddress);
      const existing = await repo.find({ where: { userId } });
      if (existing.length >= ADDRESS_BOOK_LIMIT) {
        throw new BadRequestException({
          message: "بیشتر از ۲۰ نشانی نمی‌توان ذخیره کرد.",
          code: "address_limit",
        });
      }
      const makeDefault =
        input.isDefault === true || !existing.some((row) => row.isDefault);
      if (makeDefault && existing.length) {
        await repo.update({ userId }, { isDefault: false });
      }
      const created = repo.create({
        ...value,
        userId,
        isDefault: makeDefault,
      });
      await repo.save(created);
      return { addresses: await this.view(repo, userId) };
    });
  }

  async update(actor: Actor, id: string, input: AddressDraftInput) {
    const value = this.parse(input);
    return this.locked(actor, async (manager, userId) => {
      const repo = manager.getRepository(CustomerAddress);
      const row = await repo.findOne({ where: { id, userId } });
      if (!row) throw new NotFoundException(notFound);
      row.recipientName = value.recipientName;
      row.phone = value.phone;
      row.provinceId = value.provinceId;
      row.cityId = value.cityId;
      row.provinceLabel = value.provinceLabel;
      row.cityLabel = value.cityLabel;
      row.address = value.address;
      row.postalCode = value.postalCode;
      await repo.save(row);
      return { addresses: await this.view(repo, userId) };
    });
  }

  async setDefault(actor: Actor, id: string) {
    return this.locked(actor, async (manager, userId) => {
      const repo = manager.getRepository(CustomerAddress);
      const rows = await repo.find({ where: { userId } });
      const target = rows.find((row) => row.id === id);
      if (!target) throw new NotFoundException(notFound);
      const already =
        target.isDefault && rows.filter((row) => row.isDefault).length === 1;
      if (!already) {
        await repo.update({ userId }, { isDefault: false });
        await repo.update({ id, userId }, { isDefault: true });
      }
      return { addresses: await this.view(repo, userId) };
    });
  }

  async remove(actor: Actor, id: string) {
    return this.locked(actor, async (manager, userId) => {
      const repo = manager.getRepository(CustomerAddress);
      const row = await repo.findOne({ where: { id, userId } });
      if (!row) throw new NotFoundException(notFound);
      const wasDefault = row.isDefault;
      await repo.delete({ id, userId });
      if (wasDefault) {
        const [next] = await repo.find({
          where: { userId },
          order: { createdAt: "DESC", id: "DESC" },
          take: 1,
        });
        if (next) {
          next.isDefault = true;
          await repo.save(next);
        }
      }
      return { addresses: await this.view(repo, userId) };
    });
  }

  private parse(input: AddressDraftInput) {
    const parsed = parseAddressInput(input);
    if (!parsed.ok) {
      throw new BadRequestException({
        message: parsed.message,
        code: parsed.code,
      });
    }
    return parsed.value;
  }

  private async existingUserId(actor: Actor) {
    const userId = requireUserId(actor);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException(authRequired);
    return user.id;
  }

  /**
   * Serializes every write for one customer on the user row, then applies
   * the default flag. The partial unique index rejects a second default if
   * two transactions ever overlap.
   */
  private async locked<T>(
    actor: Actor,
    work: (manager: EntityManager, userId: string) => Promise<T>,
  ) {
    const userId = requireUserId(actor);
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.getRepository(User).findOne({
          where: { id: userId },
          lock: { mode: "pessimistic_write" },
        });
        if (!user) throw new UnauthorizedException(authRequired);
        return work(manager, user.id);
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new ConflictException({
        message: "نشانی پیش‌فرض همزمان تغییر کرد. صفحه را تازه کنید.",
        code: "default_conflict",
      });
    }
  }

  private async view(repo: Repository<CustomerAddress>, userId: string) {
    const rows = await ordered(repo, userId);
    return rows.map(toCustomerAddress);
  }
}

function requireUserId(actor: Actor) {
  if (!actor.user) throw new UnauthorizedException(authRequired);
  return actor.user.id;
}

function ordered(repo: Repository<CustomerAddress>, userId: string) {
  return repo.find({
    where: { userId },
    order: { isDefault: "DESC", createdAt: "DESC", id: "ASC" },
  });
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
