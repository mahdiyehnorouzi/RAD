import { canAdmin } from "../admin/permissions";
import { AdminGuard } from "../common/guards/admin.guard";
import type { AuthedRequest } from "../common/session.middleware";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { AssignIdentityDto, ReserveIdentityBatchDto } from "./dto";
import { IdentitiesService } from "./identities.service";
import { IdentityPrintService } from "./identity-print.service";
import { qrSvg } from "./identity-print";

export function assertIdentityWrite(role: string | undefined) {
  if (!canAdmin(role, "product.write")) {
    throw new ForbiddenException("اجازه رزرو یا تغییر شماره رَد را ندارید.");
  }
}

@Controller("admin/identities")
@UseGuards(AdminGuard)
export class AdminIdentitiesController {
  constructor(
    private readonly identities: IdentitiesService,
    private readonly print: IdentityPrintService,
  ) {}

  @Get("summary")
  summary() {
    return this.identities.summary();
  }

  @Get("batches")
  batches() {
    return this.identities.listBatches();
  }

  @Post("batches")
  reserve(
    @Body() body: ReserveIdentityBatchDto,
    @Req() request: AuthedRequest,
  ) {
    assertIdentityWrite(request.adminRole);
    return this.identities
      .reserve(body, request.userId ?? null)
      .then((result) => ({
        batch: this.identities.toBatch(result.batch, result.replayed),
        identities: result.identities.map((identity) => identity.radNumber),
        startNumber: result.batch.startNumber,
        endNumber: result.batch.endNumber,
        replayed: result.replayed,
      }));
  }

  @Get("batches/:batchId/export")
  async exportBatch(
    @Param("batchId") batchId: string,
    @Req() request: AuthedRequest,
  ) {
    assertIdentityWrite(request.adminRole);
    const file = await this.print.exportBatch(batchId);
    return new StreamableFile(file.buffer, {
      type: "application/zip",
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Post("batches/:batchId/printed")
  markPrinted(
    @Param("batchId") batchId: string,
    @Req() request: AuthedRequest,
  ) {
    assertIdentityWrite(request.adminRole);
    return this.print.markPrinted(batchId);
  }

  @Get()
  list(
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("batchId") batchId?: string,
    @Query("assignment") assignment?: string,
  ) {
    return this.identities.list({ q, status, batchId, assignment });
  }

  @Get(":id/qr.svg")
  @Header("Cache-Control", "public, max-age=86400")
  async svg(@Param("id") id: string) {
    const identity = await this.identities.get(id);
    if (!identity) throw new NotFoundException("این شماره پیدا نشد.");
    const { svg } = qrSvg(identity.permanentUrl);
    return new StreamableFile(Buffer.from(svg), {
      type: "image/svg+xml",
      disposition: `inline; filename="${identity.label}.svg"`,
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const identity = await this.identities.get(id);
    if (!identity) throw new NotFoundException("این شماره پیدا نشد.");
    return identity;
  }

  @Post(":id/assign")
  assign(
    @Param("id") id: string,
    @Body() body: AssignIdentityDto,
    @Req() request: AuthedRequest,
  ) {
    assertIdentityWrite(request.adminRole);
    return this.identities.assign(id, body.productId);
  }
}
