import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  AdminProductImageInputDto,
  PRODUCT_IMAGE_STORAGES,
} from "./product-image-input.dto";

/**
 * PR 3 baseline-safety check: proves the admin API's INPUT allowlist
 * (`@IsIn(PRODUCT_IMAGE_STORAGES)`) already rejects `storage: "s3"` /
 * `"s3_video"` today, exactly as intended — this is the outermost gate
 * that makes S3-backed product images fully unreachable through the real
 * admin API before any provider is wired in. See the doc comment on
 * `PRODUCT_IMAGE_STORAGES` for why adding these values here requires a
 * matching `AdminService.saveProduct` branch landing in the same change,
 * not independently.
 */
describe("AdminProductImageInputDto — storage allowlist", () => {
  test("PRODUCT_IMAGE_STORAGES does not yet include s3/s3_video", () => {
    assert.equal((PRODUCT_IMAGE_STORAGES as readonly string[]).includes("s3"), false);
    assert.equal(
      (PRODUCT_IMAGE_STORAGES as readonly string[]).includes("s3_video"),
      false,
    );
  });

  test("rejects storage: 's3' at the DTO validation layer", async () => {
    const dto = plainToInstance(AdminProductImageInputDto, {
      storage: "s3",
      objectKey: "rad/products/prod_1/" + "a".repeat(32),
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === "storage"));
  });

  test("rejects storage: 's3_video' at the DTO validation layer", async () => {
    const dto = plainToInstance(AdminProductImageInputDto, {
      storage: "s3_video",
      objectKey: "rad/products/prod_1/" + "a".repeat(32),
    });
    const errors = await validate(dto);
    assert.ok(errors.some((error) => error.property === "storage"));
  });

  test("regression: still accepts every currently-supported storage value", async () => {
    for (const storage of PRODUCT_IMAGE_STORAGES) {
      const dto = plainToInstance(AdminProductImageInputDto, {
        storage,
        src: storage === "cloudinary" || storage === "cloudinary_video" ? undefined : "x",
        objectKey:
          storage === "cloudinary" || storage === "cloudinary_video"
            ? "rad/products/prod_1/abc"
            : undefined,
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
