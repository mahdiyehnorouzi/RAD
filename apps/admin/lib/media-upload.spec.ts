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

describe("buildUploadRequest — cloudinary", () => {
  const signed: SignedUpload = {
    provider: "cloudinary",
    cloudName: "rad-cloud",
    apiKey: "test-api-key",
    timestamp: 1700000000,
    folder: "rad/pending",
    signature: "abc123signature",
    allowed_formats: "jpg,png,webp",
    overwrite: true,
    resourceType: "image",
  };

  test("targets Cloudinary's own upload endpoint for the signed resourceType", () => {
    const { url } = buildUploadRequest(signed, fakeFile("a.jpg", "image/jpeg"));
    assert.equal(url, "https://api.cloudinary.com/v1_1/rad-cloud/image/upload");
  });

  test("form includes the file plus every signed param Cloudinary expects", () => {
    const { body } = buildUploadRequest(
      signed,
      fakeFile("a.jpg", "image/jpeg"),
    );
    assert.equal(body.get("api_key"), "test-api-key");
    assert.equal(body.get("timestamp"), "1700000000");
    assert.equal(body.get("folder"), "rad/pending");
    assert.equal(body.get("signature"), "abc123signature");
    assert.equal(body.get("allowed_formats"), "jpg,png,webp");
    assert.equal(body.get("overwrite"), "true");
    assert.ok(body.get("file") instanceof File);
    // never a seaweedfs-only field
    assert.equal(body.get("Content-Type"), null);
  });

  test("omits optional cloudinary fields the signed response didn't include", () => {
    const { body } = buildUploadRequest(
      { ...signed, allowed_formats: undefined, overwrite: undefined },
      fakeFile("a.jpg", "image/jpeg"),
    );
    assert.equal(body.get("allowed_formats"), null);
    assert.equal(body.get("overwrite"), null);
  });
});

describe("buildUploadRequest — seaweedfs", () => {
  const signed: SignedUpload = {
    provider: "seaweedfs",
    url: "http://seaweedfs.internal:8333/rad-media",
    fields: {
      bucket: "rad-media",
      key: "rad/pending/abc123",
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": "test/20261018/us-east-1/s3/aws4_request",
      "X-Amz-Date": "20261018T173153Z",
      Policy: "base64policy==",
      "X-Amz-Signature": "deadbeef",
    },
    objectKey: "rad/pending/abc123",
    resourceType: "image",
  };

  test("posts straight to the presigned bucket URL, not Cloudinary's endpoint", () => {
    const { url } = buildUploadRequest(signed, fakeFile("a.jpg", "image/jpeg"));
    assert.equal(url, "http://seaweedfs.internal:8333/rad-media");
  });

  test("form includes every signed policy field plus a real Content-Type", () => {
    const { body } = buildUploadRequest(
      signed,
      fakeFile("a.jpg", "image/jpeg"),
    );
    for (const [key, value] of Object.entries(signed.fields))
      assert.equal(body.get(key), value);
    assert.equal(body.get("Content-Type"), "image/jpeg");
    // never a cloudinary-only field
    assert.equal(body.get("api_key"), null);
  });

  /**
   * Regression guard: S3 ignores any multipart field appended after
   * `file` — if a future edit appends something past it, this test
   * catches it rather than letting SeaweedFS silently drop a policy
   * field at upload time.
   */
  test("`file` is the last field appended, as S3's POST policy requires", () => {
    const { body } = buildUploadRequest(
      signed,
      fakeFile("a.jpg", "image/jpeg"),
    );
    const keys = Array.from(body.keys());
    assert.equal(keys.at(-1), "file");
  });
});

describe("resolveUploadedObjectKey", () => {
  const cloudinarySigned: SignedUpload = {
    provider: "cloudinary",
    cloudName: "rad-cloud",
    apiKey: "test-api-key",
    timestamp: 1700000000,
    folder: "rad/pending",
    signature: "abc123signature",
    resourceType: "image",
  };
  const seaweedfsSigned: SignedUpload = {
    provider: "seaweedfs",
    url: "http://seaweedfs.internal:8333/rad-media",
    fields: { key: "rad/pending/abc123" },
    objectKey: "rad/pending/abc123",
    resourceType: "image",
  };

  test("cloudinary: parses public_id out of the upload response body", () => {
    const objectKey = resolveUploadedObjectKey(
      cloudinarySigned,
      JSON.stringify({ public_id: "rad/pending/xyz789" }),
    );
    assert.equal(objectKey, "rad/pending/xyz789");
  });

  test("cloudinary: rejects a response body with no public_id", () => {
    assert.throws(() =>
      resolveUploadedObjectKey(cloudinarySigned, JSON.stringify({})),
    );
  });

  test("cloudinary: rejects a non-JSON response body", () => {
    assert.throws(() => resolveUploadedObjectKey(cloudinarySigned, "not json"));
  });

  test("seaweedfs: uses the object key already minted at sign time, ignoring the response body entirely (S3 returns 204 with none)", () => {
    const objectKey = resolveUploadedObjectKey(seaweedfsSigned, "");
    assert.equal(objectKey, "rad/pending/abc123");
  });
});
