import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ValidationPipe } from "@nestjs/common";
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { Actor } from "../common/identity";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  adminRole: string | null;
  passwordHash: string;
  status: string;
};

function actor(
  user: { id: string; name: string; email: string } | null,
): Actor {
  return {
    user: user
      ? {
          ...user,
          phone: null,
          role: "customer",
          adminRole: null,
        }
      : null,
    guestId: "guest-1",
  };
}

function repo(rows: Row[], options?: { missPhoneLookup?: boolean }) {
  const patches: Array<Record<string, unknown>> = [];
  return {
    patches,
    findOne: async ({ where }: { where: { id?: string; phone?: string } }) => {
      if (where.phone && options?.missPhoneLookup) return null;
      return (
        rows.find((row) => {
          if (where.id && row.id !== where.id) return false;
          if (where.phone && row.phone !== where.phone) return false;
          return true;
        }) ?? null
      );
    },
    update: async (
      where: { id: string },
      patch: { name: string; phone?: string | null },
    ) => {
      patches.push(patch);
      const row = rows.find((item) => item.id === where.id);
      if (!row) return;
      if (
        patch.phone &&
        rows.some((item) => item.id !== row.id && item.phone === patch.phone)
      ) {
        const driverError = new Error("duplicate key") as Error & {
          code: string;
        };
        driverError.code = "23505";
        throw new QueryFailedError("update", [], driverError);
      }
      Object.assign(row, patch);
    },
  };
}

function service(rows: Row[], options?: { missPhoneLookup?: boolean }) {
  const users = repo(rows, options);
  return { users, profiles: new ProfileService(users as never) };
}

const buyer: Row = {
  id: "user-1",
  name: "سارا",
  email: "sara@example.com",
  phone: null,
  role: "customer",
  adminRole: null,
  passwordHash: "hashed",
  status: "active",
};

describe("ProfileService.update", () => {
  test("loads the session user and returns the saved name and phone without secrets", async () => {
    const { profiles } = service([
      { ...buyer, name: "سارا محمدی", phone: "09120000000" },
    ]);
    const result = await profiles.update(actor(buyer), {
      name: "سارا محمدی",
      phone: "۰۹۱۲۰۰۰۰۰۰۰",
    });
    assert.equal(result.user.name, "سارا محمدی");
    assert.equal(result.user.phone, "09120000000");
    assert.equal(result.user.email, "sara@example.com");
    assert.equal("passwordHash" in result.user, false);
    assert.equal("id" in result.user, true);
    assert.equal(result.user.id, "user-1");
  });

  test("a valid update stores the canonical mobile and leaves email untouched", async () => {
    const rows = [{ ...buyer }];
    const { users, profiles } = service(rows);
    const result = await profiles.update(actor(buyer), {
      name: "  سارا   محمدی ",
      phone: "٩١٢١٢٣٤٥٦٧",
    });
    assert.equal(result.user.name, "سارا محمدی");
    assert.equal(result.user.phone, "09121234567");
    assert.equal(rows[0]?.email, "sara@example.com");
    assert.deepEqual(Object.keys(users.patches[0] ?? {}).sort(), [
      "name",
      "phone",
    ]);
    assert.equal("email" in (users.patches[0] ?? {}), false);
  });

  test("clearing the phone stores null and does not rewrite other accounts", async () => {
    const rows = [{ ...buyer, phone: "09121234567" }];
    const { profiles } = service(rows);
    const result = await profiles.update(actor(buyer), {
      name: "سارا محمدی",
      phone: "   ",
    });
    assert.equal(result.user.phone, null);
    assert.equal(rows[0]?.phone, null);
  });

  test("omitting phone keeps the saved number", async () => {
    const rows = [{ ...buyer, phone: "09121234567" }];
    const { users, profiles } = service(rows);
    await profiles.update(actor(buyer), { name: "سارا محمدی" });
    assert.deepEqual(users.patches[0], { name: "سارا محمدی" });
    assert.equal(rows[0]?.phone, "09121234567");
  });

  test("an invalid phone is rejected in Persian and nothing is written", async () => {
    const rows = [{ ...buyer, name: "سارا" }];
    const { users, profiles } = service(rows);
    await assert.rejects(
      () =>
        profiles.update(actor(buyer), {
          name: "سارا محمدی",
          phone: "02112345678",
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const body = error.getResponse() as { message?: string; code?: string };
        assert.equal(body.code, "phone_invalid");
        assert.match(body.message ?? "", /موبایل/);
        return true;
      },
    );
    assert.equal(users.patches.length, 0);
    assert.equal(rows[0]?.name, "سارا");
  });

  test("a too-short name is rejected in Persian", async () => {
    const { profiles } = service([{ ...buyer }]);
    await assert.rejects(
      () => profiles.update(actor(buyer), { name: " س ", phone: "" }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const body = error.getResponse() as { code?: string; message?: string };
        assert.equal(body.code, "name_invalid");
        assert.match(body.message ?? "", /۲/);
        return true;
      },
    );
  });

  test("a duplicate phone is rejected and the caller's email stays the login address", async () => {
    const rows: Row[] = [
      { ...buyer },
      {
        ...buyer,
        id: "user-2",
        email: "other@example.com",
        phone: "09120000000",
      },
    ];
    const { profiles } = service(rows);
    await assert.rejects(
      () =>
        profiles.update(actor(buyer), {
          name: "سارا محمدی",
          phone: "09120000000",
        }),
      (error: unknown) => {
        assert.ok(error instanceof ConflictException);
        const body = error.getResponse() as { code?: string; message?: string };
        assert.equal(body.code, "phone_taken");
        assert.match(body.message ?? "", /حساب دیگری/);
        return true;
      },
    );
    assert.equal(rows[0]?.email, "sara@example.com");
    assert.equal(rows[0]?.phone, null);
  });

  test("a unique-index race still returns phone_taken", async () => {
    const rows: Row[] = [
      { ...buyer },
      {
        ...buyer,
        id: "user-2",
        email: "other@example.com",
        phone: "09123334444",
      },
    ];
    const { profiles } = service(rows, { missPhoneLookup: true });
    await assert.rejects(
      () =>
        profiles.update(actor(buyer), {
          name: "سارا محمدی",
          phone: "09123334444",
        }),
      (error: unknown) => {
        assert.ok(error instanceof ConflictException);
        const body = error.getResponse() as { code?: string };
        assert.equal(body.code, "phone_taken");
        return true;
      },
    );
  });

  test("saving the same phone the account already has is allowed", async () => {
    const rows = [{ ...buyer, phone: "09121234567" }];
    const { profiles } = service(rows);
    const result = await profiles.update(actor(buyer), {
      name: "سارا محمدی",
      phone: "09121234567",
    });
    assert.equal(result.user.phone, "09121234567");
  });

  test("a guest cannot update a profile, even if the body names a user id", async () => {
    const { users, profiles } = service([{ ...buyer }]);
    await assert.rejects(
      () =>
        profiles.update(actor(null), {
          name: "سارا محمدی",
          phone: "09121234567",
        }),
      (error: unknown) => {
        assert.ok(error instanceof UnauthorizedException);
        const body = error.getResponse() as { code?: string };
        assert.equal(body.code, "auth_required");
        return true;
      },
    );
    assert.equal(users.patches.length, 0);
  });

  test("the session user id is the only row updated", async () => {
    const rows: Row[] = [
      { ...buyer },
      { ...buyer, id: "user-2", email: "other@example.com", name: "دیگر" },
    ];
    const { profiles } = service(rows);
    await profiles.update(actor(buyer), { name: "سارا محمدی", phone: "" });
    assert.equal(rows[0]?.name, "سارا محمدی");
    assert.equal(rows[1]?.name, "دیگر");
  });
});

describe("UpdateProfileDto", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  test("rejects an email change instead of accepting a new login address", async () => {
    await assert.rejects(
      () =>
        pipe.transform(
          {
            name: "سارا محمدی",
            email: "taken@example.com",
            id: "user-2",
          },
          { type: "body", metatype: UpdateProfileDto },
        ),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });

  test("rejects a one-character name in Persian and does not accept it as an email", async () => {
    await assert.rejects(
      () =>
        pipe.transform(
          { name: "a", phone: "not-a-phone" },
          { type: "body", metatype: UpdateProfileDto },
        ),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const body = error.getResponse() as { message?: string | string[] };
        const message = Array.isArray(body.message)
          ? body.message.join(" ")
          : body.message;
        assert.match(message ?? "", /نام باید حداقل ۲ نویسه باشد/);
        return true;
      },
    );
  });

  test("accepts a trimmed name and a phone the service will normalize", async () => {
    const dto = (await pipe.transform(
      { name: "  سارا محمدی  ", phone: "۰۹۱۲۱۲۳۴۵۶۷" },
      { type: "body", metatype: UpdateProfileDto },
    )) as UpdateProfileDto;
    assert.equal(dto.name, "سارا محمدی");
    assert.equal(dto.phone, "۰۹۱۲۱۲۳۴۵۶۷");
    assert.equal("email" in dto, false);
  });
});
