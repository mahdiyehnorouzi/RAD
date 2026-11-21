import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CANONICAL_RAD_ORIGIN } from "@rad/types";
import { DataSource } from "typeorm";
import {
  RadIdentity,
  RadIdentityBatch,
  RadIdentityEvent,
} from "../database/entities";
import {
  buildIdentityArchive,
  verifyPublicIdentityUrls,
} from "./identity-print";
import { IdentitiesService } from "./identities.service";

@Injectable()
export class IdentityPrintService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly identities: IdentitiesService,
  ) {}

  async exportBatch(batchId: string) {
    const loaded = await this.identities.batchRows(batchId);
    if (!loaded) throw new NotFoundException("دسته پیدا نشد.");
    if (!loaded.rows.length) {
      throw new ConflictException({
        message: "این دسته شماره‌ای ندارد.",
        code: "batch_empty",
      });
    }
    const archive = await buildIdentityArchive(loaded.rows);
    if (!archive.verification.ok) {
      throw new ConflictException({
        message: "فایل QR این دسته تأیید نشد.",
        code: "qr_verification_failed",
        failures: archive.verification.failures,
      });
    }
    const filename = `RAD-${loaded.batch.startNumber}-${loaded.batch.endNumber}.zip`;
    return { buffer: archive.buffer, filename };
  }

  async markPrinted(batchId: string) {
    const loaded = await this.identities.batchRows(batchId);
    if (!loaded) throw new NotFoundException("دسته پیدا نشد.");
    const archive = await buildIdentityArchive(loaded.rows);
    if (!archive.verification.ok) {
      throw new ConflictException({
        message: "فایل QR این دسته تأیید نشد و چاپ ثبت نمی‌شود.",
        code: "qr_verification_failed",
        failures: archive.verification.failures,
      });
    }
    const origin =
      process.env.RAD_IDENTITY_PUBLIC_ORIGIN || CANONICAL_RAD_ORIGIN;
    const http = await verifyPublicIdentityUrls({ rows: loaded.rows, origin });
    if (!http.ok) {
      throw new ConflictException({
        message: "آدرس عمومی بعضی شماره‌ها هنوز درست باز نمی‌شود.",
        code: "public_url_unverified",
        checks: http.checks,
      });
    }
    const printedAt = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.update(RadIdentityBatch, { id: batchId }, { printedAt });
      await manager
        .createQueryBuilder()
        .update(RadIdentity)
        .set({ printedAt })
        .where(`"batchId" = :batchId`, { batchId })
        .execute();
      const rows = await manager.getRepository(RadIdentity).find({
        where: { batchId },
      });
      const events = manager.getRepository(RadIdentityEvent);
      await events.save(
        rows.map((row) =>
          events.create({
            identityId: row.id,
            kind: "printed",
            productId: row.productId,
            batchId,
          }),
        ),
      );
    });
    const batch = await this.dataSource
      .getRepository(RadIdentityBatch)
      .findOneByOrFail({ id: batchId });
    return this.identities.toBatch(batch);
  }

  /** Kept for tests that want the HTTP checker without marking the batch. */
  async checkPublic(
    batchId: string,
    origin = process.env.RAD_IDENTITY_PUBLIC_ORIGIN || CANONICAL_RAD_ORIGIN,
  ) {
    const loaded = await this.identities.batchRows(batchId);
    if (!loaded) throw new NotFoundException("دسته پیدا نشد.");
    return verifyPublicIdentityUrls({ rows: loaded.rows, origin });
  }
}
