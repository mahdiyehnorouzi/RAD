import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createMediaStorageResolver,
  isRemoteMediaStorage,
  isVideoStorage,
} from "./media-storage.interface";

describe("media storage helpers", () => {
  test("recognizes only S3-backed media as remote", () => {
    assert.equal(isRemoteMediaStorage("seaweedfs"), true);
    assert.equal(isRemoteMediaStorage("seaweedfs_video"), true);
    assert.equal(isRemoteMediaStorage("legacy_base64"), false);
    assert.equal(isRemoteMediaStorage("static"), false);
    assert.equal(isRemoteMediaStorage("external"), false);
    assert.equal(isRemoteMediaStorage(null), false);
    assert.equal(isRemoteMediaStorage(undefined), false);
  });

  test("recognizes video storage", () => {
    assert.equal(isVideoStorage("seaweedfs_video"), true);
    assert.equal(isVideoStorage("seaweedfs"), false);
    assert.equal(isVideoStorage("static"), false);
  });

  test("resolves persisted remote media to the S3-compatible provider", () => {
    const seaweedfs = { marker: "seaweedfs" } as never;
    const resolve = createMediaStorageResolver(seaweedfs);
    assert.equal(resolve("seaweedfs"), seaweedfs);
    assert.equal(resolve("seaweedfs_video"), seaweedfs);
    assert.equal(resolve("static"), seaweedfs);
  });
});
