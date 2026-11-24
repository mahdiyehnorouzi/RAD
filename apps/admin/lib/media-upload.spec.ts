import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildUploadRequest,
  resolveUploadedObjectKey,
  type SignedUpload,
} from "./media-upload";

function fakeFile(name: string, type: string, content = "x") {
  return new File([content], name, { type });
}

const signed: SignedUpload = {
  provider: "seaweedfs",
  url: "https://api.rad-object.com/storage/rad-public",
  fields: {
    key: "rad/pending/abc123",
    Policy: "base64policy==",
    "X-Amz-Signature": "deadbeef",
  },
  objectKey: "rad/pending/abc123",
  resourceType: "image",
};

describe("S3-compatible signed uploads", () => {
  test("posts to the presigned storage URL", () => {
    const { url } = buildUploadRequest(signed, fakeFile("a.jpg", "image/jpeg"));
    assert.equal(url, signed.url);
  });

  test("includes signed policy fields and Content-Type, with file last", () => {
    const { body } = buildUploadRequest(
      signed,
      fakeFile("a.jpg", "image/jpeg"),
    );
    for (const [key, value] of Object.entries(signed.fields))
      assert.equal(body.get(key), value);
    assert.equal(body.get("Content-Type"), "image/jpeg");
    assert.equal(Array.from(body.keys()).at(-1), "file");
  });

  test("uses the object key minted by the API even when storage returns no body", () => {
    assert.equal(resolveUploadedObjectKey(signed, ""), signed.objectKey);
  });
});
