import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import {
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from "@aws-sdk/client-s3";
import { SeaweedfsStorageService } from "./seaweedfs-storage.service";

function service(env: Record<string, string> = {}) {
  return new SeaweedfsStorageService(
    new ConfigService({
      SEAWEEDFS_ENDPOINT: "http://seaweedfs.internal:8333",
      SEAWEEDFS_BUCKET: "rad-media",
      SEAWEEDFS_ACCESS_KEY: "test-access-key",
      SEAWEEDFS_SECRET_KEY: "test-secret-key",
      ...env,
    }),
  );
}

function stubSend(fn: (command: unknown) => unknown): () => void {
  const original = S3Client.prototype.send;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S3Client.prototype.send = fn as any;
  return () => {
    S3Client.prototype.send = original;
  };
}

describe("SeaweedfsStorageService config", () => {
  test("throws when SeaweedFS config is missing (never silently signs/verifies with empty credentials)", async () => {
    const storage = new SeaweedfsStorageService(new ConfigService({}));
    await assert.rejects(
      () => storage.createSignedUpload("rad/pending"),
      ServiceUnavailableException,
    );
    await assert.rejects(
      () => storage.verifyMedia("rad/pending/abc", "image"),
      ServiceUnavailableException,
    );
    await assert.rejects(
      () => storage.destroy("rad/pending/abc"),
      ServiceUnavailableException,
    );
  });
});

describe("SeaweedfsStorageService.createSignedUpload", () => {
  test("returns a presigned POST scoped under the given folder, with no secret leaked", async () => {
    const result = await service().createSignedUpload("rad/products/prod_1");
    assert.equal(result.provider, "seaweedfs");
    assert.ok(result.objectKey.startsWith("rad/products/prod_1/"));
    assert.equal(result.resourceType, "image");
    assert.ok(result.url.length > 0);
    assert.ok(result.fields.key === result.objectKey);
    assert.equal(JSON.stringify(result).includes("test-secret-key"), false);
  });

  test("two signed uploads for the same folder mint different object keys", async () => {
    const storage = service();
    const first = await storage.createSignedUpload("rad/pending");
    const second = await storage.createSignedUpload("rad/pending");
    assert.notEqual(first.objectKey, second.objectKey);
  });

  test("rewrites the signed POST host to SEAWEEDFS_PUBLIC_UPLOAD_URL when set, keeping the signed fields and path intact", async () => {
    const result = await service({
      SEAWEEDFS_ENDPOINT: "http://127.0.0.1:8333",
      SEAWEEDFS_PUBLIC_UPLOAD_URL: "https://media-upload.example.com",
    }).createSignedUpload("rad/products/prod_1");
    assert.ok(result.url.startsWith("https://media-upload.example.com/"));
    assert.equal(result.url.includes("127.0.0.1"), false);
    assert.equal(result.fields.key, result.objectKey);
  });

  test("falls back to the signed (internal) URL when SEAWEEDFS_PUBLIC_UPLOAD_URL is unset", async () => {
    const result = await service({
      SEAWEEDFS_ENDPOINT: "http://127.0.0.1:8333",
    }).createSignedUpload("rad/products/prod_1");
    assert.ok(result.url.startsWith("http://127.0.0.1:8333"));
  });

  test("video kind is reflected in the returned resourceType", async () => {
    const result = await service().createSignedUpload(
      "rad/products/prod_1",
      "video",
    );
    assert.equal(result.resourceType, "video");
  });

  /**
   * Regression test: S3's POST policy rejects any form field the browser
   * sends that isn't covered by a `Conditions` entry. The admin client
   * must be able to send the file's real `Content-Type` field (so
   * `verifyMedia` can read it back), so the signed policy's base64
   * `Policy` field must actually contain a condition that allows it —
   * this decodes that policy and checks, rather than trusting the SDK
   * call succeeded.
   */
  test("the signed policy allows a Content-Type field scoped to the requested kind", async () => {
    const result = await service().createSignedUpload(
      "rad/products/prod_1",
      "video",
    );
    const policy = JSON.parse(
      Buffer.from(result.fields.Policy, "base64").toString("utf8"),
    );
    const allowsContentType = policy.conditions.some(
      (condition: unknown) =>
        Array.isArray(condition) &&
        condition[0] === "starts-with" &&
        condition[1] === "$Content-Type" &&
        condition[2] === "video/",
    );
    assert.ok(
      allowsContentType,
      "expected a starts-with Content-Type condition for 'video/'",
    );
  });
});

describe("SeaweedfsStorageService.verifyMedia", () => {
  test("accepts an object within size limits and matching content-type prefix", async () => {
    const restore = stubSend(async (command) => {
      assert.ok(command instanceof HeadObjectCommand);
      return { ContentLength: 168_000, ContentType: "image/jpeg" };
    });
    try {
      const result = await service().verifyMedia("rad/pending/abc", "image");
      assert.deepEqual(result, {
        objectKey: "rad/pending/abc",
        storage: "seaweedfs",
      });
    } finally {
      restore();
    }
  });

  test("tags video objects with the seaweedfs_video storage kind", async () => {
    const restore = stubSend(async () => ({
      ContentLength: 1_893_701,
      ContentType: "video/mp4",
    }));
    try {
      const result = await service().verifyMedia("rad/pending/vid1", "video");
      assert.deepEqual(result, {
        objectKey: "rad/pending/vid1",
        storage: "seaweedfs_video",
      });
    } finally {
      restore();
    }
  });

  test("accepts an object with no reported Content-Type (best-effort check only)", async () => {
    const restore = stubSend(async () => ({ ContentLength: 168_000 }));
    try {
      const result = await service().verifyMedia("rad/pending/abc", "image");
      assert.deepEqual(result, {
        objectKey: "rad/pending/abc",
        storage: "seaweedfs",
      });
    } finally {
      restore();
    }
  });

  test("rejects when the object is missing (never trusts a client-claimed upload)", async () => {
    const restore = stubSend(async () => {
      throw new NotFound({ message: "not found", $metadata: {} });
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/missing", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects when the stored content-type doesn't match the claimed kind", async () => {
    const restore = stubSend(async () => ({
      ContentLength: 168_000,
      ContentType: "video/mp4",
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects when the object exceeds the configured size limit", async () => {
    const restore = stubSend(async () => ({
      ContentLength: 100 * 1024 * 1024,
      ContentType: "image/jpeg",
    }));
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        PayloadTooLargeException,
      );
    } finally {
      restore();
    }
  });
});

describe("SeaweedfsStorageService.destroy", () => {
  test("issues a DeleteObjectCommand for the given bucket/key", async () => {
    let received: DeleteObjectCommand | undefined;
    const restore = stubSend(async (command) => {
      received = command as DeleteObjectCommand;
      return {};
    });
    try {
      await service().destroy("rad/pending/abc");
      assert.ok(received instanceof DeleteObjectCommand);
      assert.equal(received?.input.Bucket, "rad-media");
      assert.equal(received?.input.Key, "rad/pending/abc");
    } finally {
      restore();
    }
  });

  test("is idempotent: a delete the SDK reports as succeeding does not throw even for an already-gone key", async () => {
    const restore = stubSend(async () => ({}));
    try {
      await assert.doesNotReject(() => service().destroy("rad/pending/gone"));
    } finally {
      restore();
    }
  });
});
