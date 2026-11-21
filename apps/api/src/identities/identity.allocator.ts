import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { MAX_RAD_IDENTITY_BATCH } from "@rad/types";
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  IsNull,
} from "typeorm";
import {
  Product,
  RadIdentity,
  RadIdentityBatch,
  RadIdentityEvent,
} from "../database/entities";
import type { RadIdentityEventKind } from "@rad/types";
import {
  backfillLegacyIdentitiesSql,
  syncRadIdentitySequenceSql,
} from "./identity.sequence";

/** Serializes every reservation and product-number assignment. */
export const RAD_NUMBER_LOCK = 8142084;

export async function withIdentityLock<T>(
  dataSource: DataSource,
  run: (manager: EntityManager) => Promise<T>,
) {
  return dataSource.transaction(async (manager) => {
    await manager.query(`SELECT pg_advisory_xact_lock($1)`, [RAD_NUMBER_LOCK]);
    await manager.query(
      `CREATE SEQUENCE IF NOT EXISTS rad_identity_number_seq AS integer`,
    );
    await manager.query(backfillLegacyIdentitiesSql());
    await manager.query(syncRadIdentitySequenceSql());
    return run(manager);
  });
}

export async function takeRadNumbers(manager: EntityManager, count: number) {
  const rows: Array<{ n: number | string }> = await manager.query(
    `SELECT nextval('rad_identity_number_seq')::int AS n FROM generate_series(1, $1)`,
    [count],
  );
  return rows.map((row) => Number(row.n)).sort((a, b) => a - b);
}

async function addEvent(
  manager: EntityManager,
  identityId: string,
  kind: RadIdentityEventKind,
  extra: { productId?: string | null; batchId?: string | null } = {},
) {
  const events = manager.getRepository(RadIdentityEvent);
  await events.save(
    events.create({
      identityId,
      kind,
      productId: extra.productId ?? null,
      batchId: extra.batchId ?? null,
    }),
  );
}

export async function reserveIdentityBatch(
  dataSource: DataSource,
  input: {
    quantity: number;
    idempotencyKey: string;
    createdById: string | null;
  },
) {
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > MAX_RAD_IDENTITY_BATCH
  ) {
    throw new BadRequestException({
      message: `تعداد رزرو باید بین ۱ و ${MAX_RAD_IDENTITY_BATCH} باشد.`,
      code: "batch_quantity_invalid",
    });
  }
  const key = input.idempotencyKey.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(key)) {
    throw new BadRequestException({
      message: "کلید تکرار درخواست معتبر نیست.",
      code: "idempotency_key_invalid",
    });
  }

  return withIdentityLock(dataSource, async (manager) => {
    const batches = manager.getRepository(RadIdentityBatch);
    const identities = manager.getRepository(RadIdentity);
    const existing = await batches.findOne({ where: { idempotencyKey: key } });
    if (existing) {
      const rows = await identities.find({
        where: { batchId: existing.id },
        order: { radNumber: "ASC" },
      });
      return { batch: existing, identities: rows, replayed: true as const };
    }

    const numbers = await takeRadNumbers(manager, input.quantity);
    const batch = await batches.save(
      batches.create({
        idempotencyKey: key,
        quantity: numbers.length,
        startNumber: numbers[0],
        endNumber: numbers[numbers.length - 1],
        createdById: input.createdById,
        printedAt: null,
      }),
    );
    const reservedAt = new Date();
    const rows = await identities.save(
      numbers.map((radNumber) =>
        identities.create({
          radNumber,
          productId: null,
          status: "reserved",
          batchId: batch.id,
          reservedAt,
          assignedAt: null,
          printedAt: null,
        }),
      ),
    );
    for (const row of rows) {
      await addEvent(manager, row.id, "reserved", { batchId: batch.id });
    }
    return { batch, identities: rows, replayed: false as const };
  });
}

export async function insertProductWithIdentity(
  dataSource: DataSource,
  fields: DeepPartial<Product>,
  requestedRadNumber?: number | null,
) {
  return withIdentityLock(dataSource, async (manager) => {
    const products = manager.getRepository(Product);
    const identities = manager.getRepository(RadIdentity);
    const { radNumber: _ignored, id: _id, ...rest } = fields;

    if (requestedRadNumber != null) {
      const reserved = await identities.findOne({
        where: {
          radNumber: requestedRadNumber,
          status: "reserved",
          productId: IsNull(),
        },
        lock: { mode: "pessimistic_write" },
      });
      if (!reserved) {
        throw new ConflictException({
          message: "این شماره برای اثر تازه در دسترس نیست.",
          code: "identity_unavailable",
        });
      }
      const saved = await products.save(
        products.create({ ...rest, radNumber: reserved.radNumber }),
      );
      reserved.status = "assigned";
      reserved.productId = saved.id;
      reserved.assignedAt = new Date();
      await identities.save(reserved);
      await addEvent(manager, reserved.id, "assigned", {
        productId: saved.id,
        batchId: reserved.batchId,
      });
      return saved;
    }

    const radNumber = (await takeRadNumbers(manager, 1))[0];
    const saved = await products.save(products.create({ ...rest, radNumber }));
    const identity = await identities.save(
      identities.create({
        radNumber,
        productId: saved.id,
        status: "assigned",
        batchId: null,
        reservedAt: new Date(),
        assignedAt: new Date(),
        printedAt: null,
      }),
    );
    await addEvent(manager, identity.id, "assigned", { productId: saved.id });
    return saved;
  });
}

export async function assignReservedIdentity(
  dataSource: DataSource,
  identityId: string,
  productId: string,
) {
  return withIdentityLock(dataSource, async (manager) => {
    const identities = manager.getRepository(RadIdentity);
    const products = manager.getRepository(Product);
    const identity = await identities.findOne({
      where: { id: identityId },
      lock: { mode: "pessimistic_write" },
    });
    if (!identity) throw new NotFoundException("این شماره پیدا نشد.");
    if (identity.status !== "reserved" || identity.productId) {
      throw new ConflictException({
        message: "این شماره قبلاً به یک اثر وصل شده یا دیگر قابل اختصاص نیست.",
        code: "identity_unavailable",
      });
    }
    const product = await products.findOne({
      where: { id: productId },
      lock: { mode: "pessimistic_write" },
    });
    if (!product) throw new NotFoundException("محصول پیدا نشد.");
    if (product.radNumber != null) {
      throw new ConflictException({
        message: "این اثر خودش شماره رَد دارد و قابل تعویض نیست.",
        code: "rad_number_immutable",
      });
    }
    const taken = await identities.findOne({ where: { productId } });
    if (taken) {
      throw new ConflictException({
        message: "این اثر به شماره دیگری وصل است.",
        code: "identity_taken",
      });
    }
    await products.update({ id: productId }, { radNumber: identity.radNumber });
    identity.status = "assigned";
    identity.productId = productId;
    identity.assignedAt = new Date();
    await identities.save(identity);
    await addEvent(manager, identity.id, "assigned", {
      productId,
      batchId: identity.batchId,
    });
    return identities.findOneOrFail({ where: { id: identity.id } });
  });
}

export async function assignNewNumberToExistingProduct(
  dataSource: DataSource,
  productId: string,
) {
  return withIdentityLock(dataSource, async (manager) => {
    const products = manager.getRepository(Product);
    const identities = manager.getRepository(RadIdentity);
    const product = await products.findOne({
      where: { id: productId },
      lock: { mode: "pessimistic_write" },
    });
    if (!product) throw new NotFoundException("محصول پیدا نشد.");
    if (product.radNumber != null) return product;
    const radNumber = (await takeRadNumbers(manager, 1))[0];
    const reserved = await identities.save(
      identities.create({
        radNumber,
        productId: null,
        status: "reserved",
        batchId: null,
        reservedAt: new Date(),
        assignedAt: null,
        printedAt: null,
      }),
    );
    await products.update({ id: productId }, { radNumber });
    reserved.status = "assigned";
    reserved.productId = productId;
    reserved.assignedAt = new Date();
    await identities.save(reserved);
    await addEvent(manager, reserved.id, "assigned", { productId });
    return products.findOneOrFail({ where: { id: productId } });
  });
}

export async function retireIdentitiesForProduct(
  manager: EntityManager,
  productId: string,
) {
  const identities = manager.getRepository(RadIdentity);
  const rows = await identities.find({ where: { productId } });
  for (const row of rows) {
    row.status = "retired";
    row.productId = null;
    await identities.save(row);
    await addEvent(manager, row.id, "retired", {
      productId,
      batchId: row.batchId,
    });
  }
}
