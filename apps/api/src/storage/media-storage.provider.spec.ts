import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { ServiceUnavailableException } from "@nestjs/common";
import { CloudinaryStorageService } from "./cloudinary-storage.service";
import { S3StorageService } from "./s3-storage.service";
import {
  resolveMediaStorageProviderName,
  selectMediaStorageProvider,
} from "./media-storage.provider";

const VALID_S3_ENV = {
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY_ID: "test",
  S3_SECRET_ACCESS_KEY: "test",
  S3_ENDPOINT: "http://127.0.0.1:8333",
  S3_PUBLIC_ENDPOINT: "https://media.rad-object.com",
  S3_MEDIA_BUCKET: "rad-public",
};

describe("resolveMediaStorageProviderName", () => {
  test("defaults to cloudinary when MEDIA_STORAGE_PROVIDER is unset (backward compatibility)", () => {
    assert.equal(resolveMediaStorageProviderName(undefined), "cloudinary");
  });

  test("accepts an explicit 'cloudinary'", () => {
    assert.equal(resolveMediaStorageProviderName("cloudinary"), "cloudinary");
    assert.equal(resolveMediaStorageProviderName("Cloudinary"), "cloudinary");
    assert.equal(resolveMediaStorageProviderName("  s3  "), "s3");
  });

  test("accepts an explicit 's3'", () => {
    assert.equal(resolveMediaStorageProviderName("s3"), "s3");
    assert.equal(resolveMediaStorageProviderName("S3"), "s3");
  });

  test("throws (never silently defaults) on an unrecognized explicit value", () => {
    assert.throws(() => resolveMediaStorageProviderName("seaweedfs"));
    assert.throws(() => resolveMediaStorageProviderName(""));
    assert.throws(() => resolveMediaStorageProviderName("s33"));
  });
});

describe("selectMediaStorageProvider", () => {
  function cloudinary() {
    return new CloudinaryStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: "rad-cloud",
        CLOUDINARY_API_KEY: "k",
        CLOUDINARY_API_SECRET: "s",
      }),
    );
  }

  test("returns the Cloudinary instance for 'cloudinary'", () => {
    const c = cloudinary();
    const s3 = new S3StorageService(new ConfigService(VALID_S3_ENV));
    assert.equal(selectMediaStorageProvider("cloudinary", c, s3), c);
  });

  test("returns the S3 instance for 's3' when S3 is correctly configured", () => {
    const c = cloudinary();
    const s3 = new S3StorageService(new ConfigService(VALID_S3_ENV));
    assert.equal(selectMediaStorageProvider("s3", c, s3), s3);
  });

  test("throws — does NOT silently fall back to Cloudinary — when 's3' is selected but misconfigured", () => {
    const c = cloudinary();
    const s3 = new S3StorageService(new ConfigService({})); // missing everything
    assert.throws(
      () => selectMediaStorageProvider("s3", c, s3),
      ServiceUnavailableException,
    );
  });

  test("selecting 'cloudinary' never validates S3 config at all, even if S3 is completely unconfigured", () => {
    const c = cloudinary();
    const s3 = new S3StorageService(new ConfigService({}));
    assert.doesNotThrow(() => selectMediaStorageProvider("cloudinary", c, s3));
  });
});
