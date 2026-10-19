import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import {
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from "@aws-sdk/client-s3";
import { SeaweedfsStorageService } from "./seaweedfs-storage.service";

/** Minimal, structurally-valid 1x1 PNG (real magic bytes + IHDR). */
function makePng(width = 1, height = 1): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrBody = Buffer.alloc(13);
  ihdrBody.writeUInt32BE(width, 0);
  ihdrBody.writeUInt32BE(height, 4);
  ihdrBody[8] = 8;
  ihdrBody[9] = 2;
  const length = Buffer.alloc(4);
  length.writeUInt32BE(13, 0);
  return Buffer.concat([
    sig,
    length,
    Buffer.from("IHDR"),
    ihdrBody,
    Buffer.alloc(4),
  ]);
}

/** Minimal, structurally-valid MP4 container (ftyp + moov boxes). */
function makeMp4(): Buffer {
  function box(type: string, body: Buffer) {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(8 + body.length, 0);
    return Buffer.concat([size, Buffer.from(type, "ascii"), body]);
  }
  return Buffer.concat([
    box("ftyp", Buffer.alloc(8)),
    box("moov", Buffer.alloc(0)),
  ]);
}

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
  test("accepts a real PNG regardless of what Content-Type was reported", async () => {
    const png = makePng();
    const restore = stubSend(async (command) => {
      if (command instanceof HeadObjectCommand)
        return {
          ContentLength: png.length,
          ContentType: "application/octet-stream",
        };
      if (command instanceof GetObjectCommand)
        return { Body: Readable.from([png]) };
      return {};
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

  test("tags a real MP4 with the seaweedfs_video storage kind", async () => {
    const mp4 = makeMp4();
    const restore = stubSend(async (command) => {
      if (command instanceof HeadObjectCommand)
        return { ContentLength: mp4.length };
      if (command instanceof GetObjectCommand)
        return { Body: Readable.from([mp4]) };
      return {};
    });
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

  /**
   * The actual regression this fix closes: a forged Content-Type no
   * longer matters at all — only the real bytes do. Previously, a
   * client could label arbitrary bytes `image/jpeg` and this would have
   * passed, since the old check only ever compared the (client-influenced)
   * stored Content-Type against itself.
   */
  test("rejects arbitrary bytes even when (a hypothetical) Content-Type claims they're an image", async () => {
    const garbage = Buffer.from("not an image, just plain text bytes");
    let deleteCalled = false;
    const restore = stubSend(async (command) => {
      if (command instanceof HeadObjectCommand)
        return { ContentLength: garbage.length, ContentType: "image/jpeg" };
      if (command instanceof GetObjectCommand)
        return { Body: Readable.from([garbage]) };
      if (command instanceof DeleteObjectCommand) deleteCalled = true;
      return {};
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        BadRequestException,
      );
      assert.equal(
        deleteCalled,
        true,
        "an invalid upload must be cleaned up, not left behind",
      );
    } finally {
      restore();
    }
  });

  test("rejects a video claim backed by non-container bytes", async () => {
    const garbage = Buffer.from("definitely not mp4 or webm");
    const restore = stubSend(async (command) => {
      if (command instanceof HeadObjectCommand)
        return { ContentLength: garbage.length };
      if (command instanceof GetObjectCommand)
        return { Body: Readable.from([garbage]) };
      return {};
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/vid2", "video"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects (and cleans up) an object over the configured size limit, before ever reading its body", async () => {
    let getObjectCalled = false;
    let deleteCalled = false;
    const restore = stubSend(async (command) => {
      if (command instanceof HeadObjectCommand)
        return { ContentLength: 100 * 1024 * 1024 };
      if (command instanceof GetObjectCommand) {
        getObjectCalled = true;
        return { Body: Readable.from([Buffer.alloc(0)]) };
      }
      if (command instanceof DeleteObjectCommand) deleteCalled = true;
      return {};
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        PayloadTooLargeException,
      );
      assert.equal(getObjectCalled, false);
      assert.equal(deleteCalled, true);
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
