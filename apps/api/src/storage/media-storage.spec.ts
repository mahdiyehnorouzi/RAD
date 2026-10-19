import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { CloudinaryStorageService } from "./cloudinary-storage.service";
import { S3StorageService } from "./s3-storage.service";
import type { MediaStorage } from "./media-storage.interface";

/**
 * Compile-time + runtime proof that both providers fully satisfy the
 * shared `MediaStorage` contract (the gap this hardening pass closes:
 * previously `S3StorageService` only implemented
 * `Pick<MediaStorage, "verifyMedia" | "destroy">` because
 * `createSignedUpload` was sync-only in the interface).
 */
describe("MediaStorage interface compatibility", () => {
  test("CloudinaryStorageService is assignable to MediaStorage", () => {
    const storage: MediaStorage = new CloudinaryStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: "rad-cloud",
        CLOUDINARY_API_KEY: "test-key",
        CLOUDINARY_API_SECRET: "test-secret",
      }),
    );
    assert.equal(typeof storage.createSignedUpload, "function");
    assert.equal(typeof storage.verifyMedia, "function");
    assert.equal(typeof storage.destroy, "function");
  });

  test("S3StorageService is assignable to MediaStorage", () => {
    const storage: MediaStorage = new S3StorageService(
      new ConfigService({
        S3_REGION: "us-east-1",
        S3_ACCESS_KEY_ID: "test",
        S3_SECRET_ACCESS_KEY: "test",
        S3_ENDPOINT: "http://127.0.0.1:8333",
        S3_PUBLIC_ENDPOINT: "https://media.rad-object.com",
        S3_MEDIA_BUCKET: "rad-public",
      }),
    );
    assert.equal(typeof storage.createSignedUpload, "function");
    assert.equal(typeof storage.verifyMedia, "function");
    assert.equal(typeof storage.destroy, "function");
  });

  test("createSignedUpload's discriminated union narrows correctly on `provider`", async () => {
    const cloudinary: MediaStorage = new CloudinaryStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: "rad-cloud",
        CLOUDINARY_API_KEY: "test-key",
        CLOUDINARY_API_SECRET: "test-secret",
      }),
    );
    const result = await cloudinary.createSignedUpload("rad/pending");
    if (result.provider === "cloudinary") {
      // Narrowed: TS (and this assertion) can only see Cloudinary-shaped fields here.
      assert.equal(typeof result.cloudName, "string");
      assert.equal(typeof result.signature, "string");
    } else {
      assert.fail("expected the cloudinary branch of the discriminated union");
    }
  });

  test("both providers' createSignedUpload return a Promise (async parity — no sync/async interface mismatch)", () => {
    const cloudinary = new CloudinaryStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: "rad-cloud",
        CLOUDINARY_API_KEY: "test-key",
        CLOUDINARY_API_SECRET: "test-secret",
      }),
    );
    const s3 = new S3StorageService(
      new ConfigService({
        S3_REGION: "us-east-1",
        S3_ACCESS_KEY_ID: "test",
        S3_SECRET_ACCESS_KEY: "test",
        S3_ENDPOINT: "http://127.0.0.1:8333",
        S3_PUBLIC_ENDPOINT: "https://media.rad-object.com",
        S3_MEDIA_BUCKET: "rad-public",
      }),
    );
    assert.ok(cloudinary.createSignedUpload("rad/pending") instanceof Promise);
    assert.ok(s3.createSignedUpload("rad/pending") instanceof Promise);
  });
});
