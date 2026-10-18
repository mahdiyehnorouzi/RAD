import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createMediaStorageResolver,
  isRemoteMediaStorage,
  isVideoStorage,
} from "./media-storage.interface";

describe("isRemoteMediaStorage", () => {
  test("true for every signed-upload storage kind, from either provider", () => {
    assert.equal(isRemoteMediaStorage("cloudinary"), true);
    assert.equal(isRemoteMediaStorage("cloudinary_video"), true);
    assert.equal(isRemoteMediaStorage("seaweedfs"), true);
    assert.equal(isRemoteMediaStorage("seaweedfs_video"), true);
  });

  test("false for legacy/non-remote storage kinds, including null", () => {
    assert.equal(isRemoteMediaStorage("legacy_base64"), false);
    assert.equal(isRemoteMediaStorage("static"), false);
    assert.equal(isRemoteMediaStorage("external"), false);
    assert.equal(isRemoteMediaStorage(null), false);
    assert.equal(isRemoteMediaStorage(undefined), false);
  });
});

describe("isVideoStorage", () => {
  test("true only for the video variant of either provider", () => {
    assert.equal(isVideoStorage("cloudinary_video"), true);
    assert.equal(isVideoStorage("seaweedfs_video"), true);
    assert.equal(isVideoStorage("cloudinary"), false);
    assert.equal(isVideoStorage("seaweedfs"), false);
    assert.equal(isVideoStorage("static"), false);
    assert.equal(isVideoStorage(null), false);
  });
});

/**
 * Regression coverage for the mixed-provider bug this resolver fixes:
 * `AdminService` used to call whichever ONE provider `MEDIA_STORAGE_PROVIDER`
 * made "active" for *every* row, so flipping the switch while Cloudinary
 * rows still existed made them unverifiable/undeletable (SeaweedFS would
 * get asked to HeadObject/DeleteObject a Cloudinary public_id, and vice
 * versa). The resolver must dispatch by each row's own `storage` kind,
 * never by the active provider.
 */
describe("createMediaStorageResolver", () => {
  const cloudinary = { marker: "cloudinary" } as never;
  const seaweedfs = { marker: "seaweedfs" } as never;
  const resolve = createMediaStorageResolver(cloudinary, seaweedfs);

  test("dispatches a cloudinary/cloudinary_video row to the cloudinary provider regardless of which is 'active'", () => {
    assert.equal(resolve("cloudinary"), cloudinary);
    assert.equal(resolve("cloudinary_video"), cloudinary);
  });

  test("dispatches a seaweedfs/seaweedfs_video row to the seaweedfs provider regardless of which is 'active'", () => {
    assert.equal(resolve("seaweedfs"), seaweedfs);
    assert.equal(resolve("seaweedfs_video"), seaweedfs);
  });

  test("falls back to cloudinary for a legacy/non-remote row (never actually dispatched in practice, but must not throw)", () => {
    assert.equal(resolve("static"), cloudinary);
    assert.equal(resolve(null as never), cloudinary);
  });
});
