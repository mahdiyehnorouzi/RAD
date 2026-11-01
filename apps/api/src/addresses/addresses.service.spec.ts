import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import EmbeddedPostgres from "embedded-postgres";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Controller, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueryFailedError, type DataSource } from "typeorm";
import type { Actor } from "../common/identity";
import { createAppDataSource } from "../database/data-source";
import { CustomerAddress, Order, User, entities } from "../database/entities";
import { AddCustomerAddressBook1793600000000 } from "../database/migrations/1793600000000-AddCustomerAddressBook";
import { iranDivisionsPath } from "./addresses.locations";
import { AddressesService } from "./addresses.service";
import { readFileSync } from "node:fs";

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

const divisions = JSON.parse(readFileSync(iranDivisionsPath(), "utf8")) as {
  provinces: Array<{
    id: string;
    label: string;
    cities: Array<{ id: string }>;
  }>;
};
const tehran = divisions.provinces.find(
  (province) => province.label === "تهران",
);
const alborz = divisions.provinces.find(
  (province) => province.label === "البرز",
);
if (!tehran || !alborz) throw new Error("missing provinces");

function draft(overrides: Record<string, unknown> = {}) {
  return {
    recipientName: "سارا محمدی",
    phone: "09121234567",
    provinceId: tehran!.id,
    cityId: tehran!.cities[0].id,
    address: "خیابان ولیعصر، پلاک ۱۲",
    postalCode: "1234567890",
    ...overrides,
  };
}

function actor(id: string, name: string): Actor {
  return {
    user: {
      id,
      name,
      email: `${id}@example.com`,
      phone: null,
      role: "customer",
      adminRole: null,
    },
    guestId: "guest",
  };
}

let pg: EmbeddedPostgres | undefined;
let databaseDir: string | undefined;
let dataSource: DataSource;
let service: AddressesService;

before(async () => {
  const externalUrl = process.env.RAD_ADDRESS_TEST_DATABASE_URL;
  let url = externalUrl;
  if (!url) {
    databaseDir = mkdtempSync(path.join(tmpdir(), "rad-addresses-"));
    const port = await freePort();
    pg = new EmbeddedPostgres({
      databaseDir,
      user: "rad",
      password: "rad",
      port,
      persistent: false,
      onLog: () => {},
      onError: () => {},
    });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("rad_test");
    url = `postgresql://rad:rad@127.0.0.1:${port}/rad_test`;
  }
  dataSource = createAppDataSource({
    url,
    synchronize: true,
  } as never);
  await dataSource.initialize();
  await dataSource.query(`DROP TABLE IF EXISTS "CustomerAddress"`);
  const migration = new AddCustomerAddressBook1793600000000();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await migration.up(runner);
    const orderColumns = await runner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Order'
        AND column_name IN ('name', 'city', 'phone', 'address')
    `);
    assert.equal(orderColumns.length, 4);
  } finally {
    await runner.release();
  }
  service = new AddressesService(
    dataSource.getRepository(CustomerAddress),
    dataSource.getRepository(User),
    dataSource,
  );
  await service.onModuleInit();
  const users = dataSource.getRepository(User);
  await users.save(
    users.create({
      id: "user-a",
      name: "سارا",
      email: "sara@example.com",
      passwordHash: "hashed",
      phone: null,
    }),
  );
  await users.save(
    users.create({
      id: "user-b",
      name: "نسترن",
      email: "nastaran@example.com",
      passwordHash: "hashed",
      phone: "09120000000",
    }),
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
});

async function clear() {
  await dataSource.query(`DELETE FROM "CustomerAddress"`);
}

describe("customer address book", { concurrency: 1 }, () => {
  test("the partial unique index rejects two defaults for one customer", async () => {
    await clear();
    const repo = dataSource.getRepository(CustomerAddress);
    await repo.save(
      repo.create({
        userId: "user-a",
        recipientName: "سارا",
        phone: "09121234567",
        provinceId: tehran!.id,
        cityId: tehran!.cities[0].id,
        provinceLabel: "تهران",
        cityLabel: "تهران",
        address: "خیابان ولیعصر، پلاک ۱۲",
        postalCode: null,
        isDefault: true,
      }),
    );
    await assert.rejects(
      () =>
        repo.save(
          repo.create({
            userId: "user-a",
            recipientName: "سارا",
            phone: "09121234567",
            provinceId: tehran!.id,
            cityId: tehran!.cities[0].id,
            provinceLabel: "تهران",
            cityLabel: "تهران",
            address: "خیابان ولیعصر، پلاک ۱۲",
            postalCode: null,
            isDefault: true,
          }),
        ),
      (error: unknown) => error instanceof QueryFailedError,
    );
  });

  test("a customer lists, edits, and deletes only their own addresses", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    const nastaran = actor("user-b", "نسترن");
    const created = await service.create(sara, draft());
    assert.equal(created.addresses.length, 1);
    assert.equal(created.addresses[0].isDefault, true);
    assert.equal(created.addresses[0].provinceLabel, "تهران");
    assert.equal("userId" in created.addresses[0], false);

    const hidden = await service.list(nastaran);
    assert.deepEqual(hidden.addresses, []);

    await assert.rejects(
      () =>
        service.update(
          nastaran,
          created.addresses[0].id,
          draft({
            recipientName: "نسترن کریمی",
          }),
        ),
      (error: unknown) => error instanceof NotFoundException,
    );
    await assert.rejects(
      () => service.remove(nastaran, created.addresses[0].id),
      (error: unknown) => error instanceof NotFoundException,
    );
    await assert.rejects(
      () => service.setDefault(nastaran, created.addresses[0].id),
      (error: unknown) => error instanceof NotFoundException,
    );

    const edited = await service.update(
      sara,
      created.addresses[0].id,
      draft({ recipientName: "سارا رضایی", address: "خیابان انقلاب، پلاک ۳" }),
    );
    assert.equal(edited.addresses[0].recipientName, "سارا رضایی");
    assert.equal(edited.addresses[0].isDefault, true);
    const still = await service.list(sara);
    assert.equal(still.addresses[0].recipientName, "سارا رضایی");
  });

  test("the first address is the default, a later choice replaces it, and deleting the default promotes the newest remaining address", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    const first = await service.create(sara, draft({ isDefault: false }));
    assert.equal(first.addresses[0].isDefault, true);
    const firstId = first.addresses[0].id;

    const second = await service.create(
      sara,
      draft({
        recipientName: "لیلا احمدی",
        address: "خیابان آزادی، پلاک ۸",
        isDefault: false,
      }),
    );
    assert.equal(
      second.addresses.find((row) => row.id === firstId)?.isDefault,
      true,
    );
    const secondId = second.addresses.find((row) => row.id !== firstId)!.id;
    assert.equal(
      second.addresses.find((row) => row.id === secondId)?.isDefault,
      false,
    );

    const chosen = await service.setDefault(sara, secondId);
    assert.equal(chosen.addresses.filter((row) => row.isDefault).length, 1);
    assert.equal(
      chosen.addresses.find((row) => row.id === secondId)?.isDefault,
      true,
    );

    const removed = await service.remove(sara, secondId);
    assert.equal(removed.addresses.length, 1);
    assert.equal(removed.addresses[0].id, firstId);
    assert.equal(removed.addresses[0].isDefault, true);
  });

  test("an invalid address is not stored", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    await assert.rejects(() =>
      service.create(sara, draft({ cityId: alborz!.cities[0].id })),
    );
    const rows = await service.list(sara);
    assert.deepEqual(rows.addresses, []);
  });

  test("a guest cannot read the book", async () => {
    await assert.rejects(
      () => service.list({ user: null, guestId: "guest" }),
      (error: unknown) => error instanceof UnauthorizedException,
    );
  });

  test("concurrent default changes leave exactly one default", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    const first = await service.create(sara, draft());
    const second = await service.create(
      sara,
      draft({ recipientName: "لیلا احمدی", address: "خیابان آزادی، پلاک ۸" }),
    );
    const ids = second.addresses.map((row) => row.id);
    assert.equal(ids.length, 2);
    assert.ok(ids.includes(first.addresses[0].id));
    await Promise.all(ids.map((id) => service.setDefault(sara, id)));
    const rows = await dataSource.getRepository(CustomerAddress).find({
      where: { userId: "user-a" },
    });
    assert.equal(rows.filter((row) => row.isDefault).length, 1);
  });

  test("deleting the same default twice removes it once and does not invent another customer's default", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    const nastaran = actor("user-b", "نسترن");
    const saraBook = await service.create(sara, draft());
    const nastaranBook = await service.create(
      nastaran,
      draft({ recipientName: "نسترن کریمی", phone: "09123334444" }),
    );
    const results = await Promise.allSettled([
      service.remove(sara, saraBook.addresses[0].id),
      service.remove(sara, saraBook.addresses[0].id),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      results.filter((result) => result.status === "rejected").length,
      1,
    );
    const saraLeft = await service.list(sara);
    assert.deepEqual(saraLeft.addresses, []);
    const nastaranLeft = await service.list(nastaran);
    assert.equal(nastaranLeft.addresses.length, 1);
    assert.equal(nastaranLeft.addresses[0].id, nastaranBook.addresses[0].id);
    assert.equal(nastaranLeft.addresses[0].isDefault, true);
  });

  test("concurrent creates keep a single default and stop at twenty", async () => {
    await clear();
    const sara = actor("user-a", "سارا");
    await Promise.all([
      service.create(
        sara,
        draft({ recipientName: "سارا یک", isDefault: true }),
      ),
      service.create(
        sara,
        draft({
          recipientName: "سارا دو",
          address: "خیابان آزادی، پلاک ۸",
          isDefault: true,
        }),
      ),
    ]);
    const created = await dataSource.getRepository(CustomerAddress).find({
      where: { userId: "user-a" },
    });
    assert.equal(created.length, 2);
    assert.equal(created.filter((row) => row.isDefault).length, 1);

    await clear();
    const repo = dataSource.getRepository(CustomerAddress);
    await repo.save(
      Array.from({ length: 19 }, (_, index) =>
        repo.create({
          userId: "user-a",
          recipientName: `سارا ${index + 1}`,
          phone: "09121234567",
          provinceId: tehran!.id,
          cityId: tehran!.cities[0].id,
          provinceLabel: "تهران",
          cityLabel: "تهران",
          address: "خیابان ولیعصر، پلاک ۱۲",
          postalCode: null,
          isDefault: index === 0,
        }),
      ),
    );
    const results = await Promise.allSettled([
      service.create(sara, draft({ recipientName: "بیستم" })),
      service.create(
        sara,
        draft({
          recipientName: "بیست‌ویکم",
          address: "خیابان انقلاب، پلاک ۳",
        }),
      ),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected?.status === "rejected");
    assert.ok(rejected.reason instanceof BadRequestException);
    assert.equal(
      (rejected.reason.getResponse() as { code?: string }).code,
      "address_limit",
    );
    const left = await service.list(sara);
    assert.equal(left.addresses.length, 20);
    assert.equal(left.addresses.filter((row) => row.isDefault).length, 1);
  });

  test("the twenty-first address is refused", async () => {
    await clear();
    const repo = dataSource.getRepository(CustomerAddress);
    await repo.save(
      Array.from({ length: 20 }, (_, index) =>
        repo.create({
          userId: "user-a",
          recipientName: `سارا ${index + 1}`,
          phone: "09121234567",
          provinceId: tehran!.id,
          cityId: tehran!.cities[0].id,
          provinceLabel: "تهران",
          cityLabel: "تهران",
          address: "خیابان ولیعصر، پلاک ۱۲",
          postalCode: null,
          isDefault: index === 0,
        }),
      ),
    );
    await assert.rejects(
      () =>
        service.create(
          actor("user-a", "سارا"),
          draft({ recipientName: "اضافه شده" }),
        ),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const body = error.getResponse() as { code?: string };
        assert.equal(body.code, "address_limit");
        return true;
      },
    );
    const left = await service.list(actor("user-a", "سارا"));
    assert.equal(left.addresses.length, 20);
  });

  test("dropping the address book does not drop orders", async () => {
    const users = dataSource.getRepository(User);
    const userBefore = await users.findOneByOrFail({ id: "user-a" });
    const orders = dataSource.getRepository(Order);
    const order = await orders.save(
      orders.create({
        id: "order-address-book",
        ownerKey: "user:user-a",
        userId: "user-a",
        total: 1000,
        usdTotal: 1,
        status: "confirmed",
        name: "سارا محمدی",
        city: "تهران، تهران",
        phone: "09121234567",
        address: "خیابان ولیعصر، پلاک ۱۲، کد پستی 1234567890",
      }),
    );
    const migration = new AddCustomerAddressBook1793600000000();
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await migration.down(runner);
      await migration.up(runner);
    } finally {
      await runner.release();
    }
    const kept = await orders.findOneByOrFail({ id: order.id });
    assert.equal(kept.address, order.address);
    assert.equal(kept.city, "تهران، تهران");
    assert.equal(kept.name, "سارا محمدی");
    assert.equal(kept.phone, "09121234567");
    const userAfter = await users.findOneByOrFail({ id: "user-a" });
    assert.equal(userAfter.email, userBefore.email);
    assert.equal(userAfter.name, userBefore.name);
    assert.equal(userAfter.phone, userBefore.phone);
    assert.equal(userAfter.passwordHash, userBefore.passwordHash);
  });

  test("the API refuses to start when CustomerAddress has not been migrated", async () => {
    const url = (dataSource.options as { url?: string }).url;
    assert.equal(typeof url, "string");
    await dataSource.query(`DROP TABLE IF EXISTS "CustomerAddress"`);
    const [gone] = await dataSource.query(
      `SELECT to_regclass('public."CustomerAddress"') AS present`,
    );
    assert.equal(gone.present, null);

    @Controller()
    class AddressBootController {
      constructor(readonly addresses: AddressesService) {}
    }

    @Module({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          url,
          entities: [...entities],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([...entities]),
      ],
      controllers: [AddressBootController],
      providers: [AddressesService],
    })
    class AddressBootModule {}

    const app = await NestFactory.create(AddressBootModule, { logger: false });
    try {
      // NestFactory.create() wires providers; onModuleInit runs from init(),
      // which is what listen() calls before accepting traffic.
      await assert.rejects(
        () => app.init(),
        /1793600000000-AddCustomerAddressBook/,
      );
    } finally {
      await app.close();
    }

    const migration = new AddCustomerAddressBook1793600000000();
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await migration.up(runner);
    } finally {
      await runner.release();
    }
    const started = await NestFactory.create(AddressBootModule, {
      logger: false,
    });
    try {
      await started.init();
    } finally {
      await started.close();
    }
  });
});
