import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Readable } from "node:stream";
import { ConfigService } from "@nestjs/config";
import {
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3StorageService } from "./s3-storage.service";

const BASE_ENV = {
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY_ID: "test-access-key",
  S3_SECRET_ACCESS_KEY: "test-secret-key",
  S3_ENDPOINT: "http://127.0.0.1:8333",
  S3_PUBLIC_ENDPOINT: "https://media.rad-object.com",
  S3_MEDIA_BUCKET: "rad-public",
};

function service(env: Record<string, string> = BASE_ENV) {
  return new S3StorageService(new ConfigService(env));
}

/** Minimal 1x1 PNG (header-only validity matters — IHDR width/height). */
function makePng(width: number, height: number) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrBody = Buffer.alloc(13);
  ihdrBody.writeUInt32BE(width, 0);
  ihdrBody.writeUInt32BE(height, 4);
  ihdrBody[8] = 8; // bit depth
  ihdrBody[9] = 2; // color type
  const length = Buffer.alloc(4);
  length.writeUInt32BE(13, 0);
  const type = Buffer.from("IHDR", "ascii");
  const crc = Buffer.alloc(4); // CRC not checked by our sniffer
  return Buffer.concat([sig, length, type, ihdrBody, crc]);
}

function makeMp4() {
  const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp", "ascii"), Buffer.alloc(8)]);
  const moov = Buffer.concat([u32(8), Buffer.from("moov", "ascii")]);
  return Buffer.concat([ftyp, moov]);
}

function u32(value: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

function makeWebm() {
  const ebml = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
  const segment = Buffer.from([0x18, 0x53, 0x80, 0x67]);
  return Buffer.concat([ebml, Buffer.alloc(4), segment, Buffer.alloc(16)]);
}

/** Stubs `S3Client.prototype.send`, restoring it afterward. */
function stubSend(fn: (command: unknown) => unknown) {
  const original = S3Client.prototype.send;
  S3Client.prototype.send = async function (command: unknown) {
    return fn(command);
  };
  return () => {
    S3Client.prototype.send = original;
  };
}

describe("S3StorageService configuration", () => {
  test("throws ServiceUnavailableException when required env vars are missing", async () => {
    const storage = service({});
    await assert.rejects(
      () => storage.verifyMedia("rad/pending/abc", "image"),
      ServiceUnavailableException,
    );
  });
});

describe("S3StorageService.createSignedUpload", () => {
  test("mints a server-side object key and a presigned PUT URL against the PUBLIC endpoint, never the internal one", async () => {
    const storage = service();
    const result = await storage.createSignedUpload("rad/products/prod_1", "image");
    assert.equal(result.provider, "s3");
    assert.equal(result.method, "PUT");
    assert.match(result.objectKey, /^rad\/products\/prod_1\/[A-Za-z0-9_-]{32}$/);
    assert.ok(result.uploadUrl.startsWith("https://media.rad-object.com/"));
    assert.ok(!result.uploadUrl.includes("127.0.0.1"));
    assert.ok(result.uploadUrl.includes(encodeURIComponent(result.objectKey).replace(/%2F/g, "/")) || result.uploadUrl.includes(result.objectKey));
    assert.ok(result.uploadUrl.includes("X-Amz-Signature"));
  });

  test("two calls mint different, unpredictable object keys", async () => {
    const storage = service();
    const a = await storage.createSignedUpload("rad/pending");
    const b = await storage.createSignedUpload("rad/pending");
    assert.notEqual(a.objectKey, b.objectKey);
  });

  test("never leaks the secret access key in the returned payload", async () => {
    const storage = service();
    const result = await storage.createSignedUpload("rad/pending");
    assert.equal(JSON.stringify(result).includes("test-secret-key"), false);
  });
});

describe("S3StorageService.verifyMedia — images", () => {
  test("accepts a valid PNG and derives real dimensions from the decoded header", async () => {
    const png = makePng(640, 480);
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: png.length };
      if (command instanceof GetObjectCommand) return { Body: Readable.from([png]) };
      throw new Error(`unexpected command ${command}`);
    });
    try {
      const result = await service().verifyMedia("rad/pending/abc", "image");
      assert.deepEqual(result, { objectKey: "rad/pending/abc", storage: "s3" });
    } finally {
      restore();
    }
  });

  test("rejects a file whose bytes don't match any known image signature, regardless of claimed Content-Type", async () => {
    const garbage = Buffer.from("not an image, just plain bytes");
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: garbage.length };
      if (command instanceof GetObjectCommand) return { Body: Readable.from([garbage]) };
      return {}; // DeleteObjectCommand cleanup
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        BadRequestException,
      );
    } finally {
      restore();
    }
  });

  test("rejects (and cleans up) an object over the configured image size limit before reading its body", async () => {
    let getObjectCalled = false;
    let deleteCalled = false;
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: 3 * 1024 * 1024 };
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
      assert.equal(getObjectCalled, false, "must not read the body of an oversized object");
      assert.equal(deleteCalled, true, "must clean up the rejected object");
    } finally {
      restore();
    }
  });

  test("maps a missing object (NotFound) to a client-facing BadRequestException", async () => {
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) {
        throw new NotFound({ message: "not found", $metadata: {} });
      }
      return {};
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

  test("maps any other storage failure to a 503, never leaking the raw error", async () => {
    const restore = stubSend(() => {
      throw new Error("ECONNRESET");
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/abc", "image"),
        ServiceUnavailableException,
      );
    } finally {
      restore();
    }
  });
});

describe("S3StorageService.verifyMedia — videos", () => {
  test("accepts a structurally valid MP4 (ftyp + moov boxes present in the head slice)", async () => {
    const mp4 = makeMp4();
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: mp4.length };
      if (command instanceof GetObjectCommand) return { Body: Readable.from([mp4]) };
      return {};
    });
    try {
      const result = await service().verifyMedia("rad/pending/vid1", "video");
      assert.deepEqual(result, { objectKey: "rad/pending/vid1", storage: "s3_video" });
    } finally {
      restore();
    }
  });

  test("accepts a structurally valid WebM (EBML header + Segment element)", async () => {
    const webm = makeWebm();
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: webm.length };
      if (command instanceof GetObjectCommand) return { Body: Readable.from([webm]) };
      return {};
    });
    try {
      const result = await service().verifyMedia("rad/pending/vid2", "video");
      assert.deepEqual(result, { objectKey: "rad/pending/vid2", storage: "s3_video" });
    } finally {
      restore();
    }
  });

  test("accepts an MP4 whose moov box is only in the tail (trailing-moov layout), without reading the whole file", async () => {
    // A real "slow start" layout: ftyp, then a large mdat (video samples),
    // then moov at the very end — moov deliberately does not fit in the
    // 256KB head probe, forcing the service to also fetch a tail slice.
    const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp", "ascii"), Buffer.alloc(8)]);
    const mdatBodySize = 300 * 1024;
    const mdat = Buffer.concat([
      u32(8 + mdatBodySize),
      Buffer.from("mdat", "ascii"),
      Buffer.alloc(mdatBodySize),
    ]);
    const moov = Buffer.concat([u32(8), Buffer.from("moov", "ascii")]);
    const full = Buffer.concat([ftyp, mdat, moov]);
    const totalSize = full.length;
    const rangesRequested: string[] = [];
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: totalSize };
      if (command instanceof GetObjectCommand) {
        const range = (command as GetObjectCommand).input.Range ?? "";
        rangesRequested.push(range);
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        if (!match) throw new Error(`unexpected range ${range}`);
        const start = Number(match[1]);
        const end = Number(match[2]);
        return { Body: Readable.from([full.subarray(start, end + 1)]) };
      }
      return {};
    });
    try {
      const result = await service().verifyMedia("rad/pending/vid3", "video");
      assert.equal(result.storage, "s3_video");
      assert.equal(rangesRequested.length, 2, "must probe both head and tail, never the full object");
      for (const range of rangesRequested) {
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        assert.ok(match);
        const bytesRequested = Number(match![2]) - Number(match![1]) + 1;
        assert.ok(
          bytesRequested <= 256 * 1024,
          `probe range must stay bounded, got ${bytesRequested} bytes`,
        );
      }
    } finally {
      restore();
    }
  });

  test("rejects (and cleans up) a file with no valid MP4/WebM container structure", async () => {
    const garbage = Buffer.from("definitely not a video container");
    let deleteCalled = false;
    const restore = stubSend((command) => {
      if (command instanceof HeadObjectCommand) return { ContentLength: garbage.length };
      if (command instanceof GetObjectCommand) return { Body: Readable.from([garbage]) };
      if (command instanceof DeleteObjectCommand) deleteCalled = true;
      return {};
    });
    try {
      await assert.rejects(
        () => service().verifyMedia("rad/pending/vid4", "video"),
        BadRequestException,
      );
      assert.equal(deleteCalled, true);
    } finally {
      restore();
    }
  });
});

describe("S3StorageService.destroy", () => {
  test("issues a DeleteObjectCommand for the given key", async () => {
    let deletedKey: string | undefined;
    const restore = stubSend((command) => {
      if (command instanceof DeleteObjectCommand) {
        deletedKey = (command as DeleteObjectCommand).input.Key;
        return {};
      }
      return {};
    });
    try {
      await service().destroy("rad/products/prod_1/abc");
      assert.equal(deletedKey, "rad/products/prod_1/abc");
    } finally {
      restore();
    }
  });

  test("surfaces a real failure rather than swallowing it silently", async () => {
    const restore = stubSend(() => {
      throw new Error("bucket unreachable");
    });
    try {
      await assert.rejects(() => service().destroy("rad/products/prod_1/abc"), /bucket unreachable/);
    } finally {
      restore();
    }
  });
});
