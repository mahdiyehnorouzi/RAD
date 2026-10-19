import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  AdminProductImageInputDto,
  PRODUCT_IMAGE_STORAGES,
} from "./product-image-input.dto";

/**
 * PR 3 proved `storage: "s3"`/`"s3_video"` were rejected at this DTO
 * layer (the outermost gate), specifically because `AdminService
 * .saveProduct` had no matching validation branch for them yet — adding
 * the allowlist entry alone would have been unsafe. PR 4 adds that
 * branch (see `admin.service.ts`), so this spec now proves the opposite:
 * both values are accepted here, and still only here — DTO-layer shape
 * only, not existence/ownership (that's `AdminService`'s job, covered in
 * `admin.service.spec.ts`/`replace-images.spec.ts`).
 */
describe("AdminProductImageInputDto — storage allowlist", () => {
  test("PRODUCT_IMAGE_STORAGES now includes s3/s3_video", () => {
    assert.equal((PRODUCT_IMAGE_STORAGES as readonly string[]).includes("s3"), true);
    assert.equal(
      (PRODUCT_IMAGE_STORAGES as readonly string[]).includes("s3_video"),
      true,
    );
  });

  test("accepts storage: 's3' at the DTO validation layer (shape only)", async () => {
    const dto = plainToInstance(AdminProductImageInputDto, {
      storage: "s3",
      objectKey: "rad/products/prod_1/" + "a".repeat(32),
    });
    const errors = await validate(dto);
    assert.equal(errors.some((error) => error.property === "storage"), false);
  });

  test("accepts storage: 's3_video' at the DTO validation layer (shape only)", async () => {
    const dto = plainToInstance(AdminProductImageInputDto, {
      storage: "s3_video",
      objectKey: "rad/products/prod_1/" + "a".repeat(32),
    });
    const errors = await validate(dto);
    assert.equal(errors.some((error) => error.property === "storage"), false);
  });

  test("still rejects a completely unrecognized storage value", async () => {
    const dto = plainToInstance(AdminProductImageInputDto, {
      storage: "dropbox",
      objectKey: "whatever",
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === "storage"));
  });

  test("regression: every currently-supported storage value still passes the allowlist check", async () => {
    for (const storage of PRODUCT_IMAGE_STORAGES) {
      const isRemote =
        storage === "cloudinary" ||
        storage === "cloudinary_video" ||
        storage === "s3" ||
        storage === "s3_video";
      const dto = plainToInstance(AdminProductImageInputDto, {
        storage,
        src: isRemote ? undefined : "x",
        objectKey: isRemote ? "rad/products/prod_1/abc" : undefined,
      });
      const errors = await validate(dto);
      assert.equal(
        errors.some((error) => error.property === "storage"),
        false,
        `storage "${storage}" should still pass the allowlist check`,
      );
    }
  });
});
