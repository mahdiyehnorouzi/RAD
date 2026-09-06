import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";
import { createSubmittedCommission } from "./commission.factory";
import { addCommissionMessage, artistDecideCommission } from "./commission.mutate";
import type { LocaleCopy, MakingCommission } from "./commission.types";
import type { CommissionDecideDto, CreateCommissionDto } from "./dto";

type CommissionRow = {
  id: string;
  ownerKey: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type CommissionTable = {
  findMany: (args?: {
    where?: { ownerKey?: string };
    orderBy?: { updatedAt?: "asc" | "desc" };
  }) => Promise<CommissionRow[]>;
  findUnique: (args: { where: { id: string } }) => Promise<CommissionRow | null>;
  create: (args: {
    data: { id: string; ownerKey: string; payload: Prisma.InputJsonValue };
  }) => Promise<CommissionRow>;
  update: (args: {
    where: { id: string };
    data: { payload: Prisma.InputJsonValue };
  }) => Promise<CommissionRow>;
};

type PrismaWithCommission = Omit<PrismaService, "commission"> & {
  commission: CommissionTable;
};

@Injectable()
export class CommissionsService {
  private readonly prisma: PrismaWithCommission;

  constructor(
    prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly notices: NoticesService,
  ) {
    this.prisma = prisma as unknown as PrismaWithCommission;
  }

  async listMine(actor: Actor) {
    const rows = await this.prisma.commission.findMany({
      where: { ownerKey: this.identity.key(actor) },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => this.toCommission(row.payload));
  }

  async create(actor: Actor, input: CreateCommissionDto) {
    const payload = createSubmittedCommission({
      customerName: input.customerName,
      brief: input.brief,
      title: input.title,
    });
    await this.prisma.commission.create({
      data: {
        id: payload.id,
        ownerKey: this.identity.key(actor),
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
    return payload;
  }

  async saveMine(actor: Actor, id: string, payload: MakingCommission) {
    const row = await this.requireOwned(actor, id);
    const next = { ...payload, id: row.id, updatedAt: Date.now() };
    await this.prisma.commission.update({
      where: { id },
      data: { payload: next as unknown as Prisma.InputJsonValue },
    });
    return next;
  }

  async addMineMessage(actor: Actor, id: string, body: LocaleCopy) {
    const current = this.toCommission((await this.requireOwned(actor, id)).payload);
    const next = addCommissionMessage(current, { author: "customer", body });
    await this.prisma.commission.update({
      where: { id },
      data: { payload: next as unknown as Prisma.InputJsonValue },
    });
    return next;
  }

  async listAll() {
    const rows = await this.prisma.commission.findMany({ orderBy: { updatedAt: "desc" } });
    return rows.map((row) => this.toAdmin(row));
  }

  async getAdmin(id: string) {
    const row = await this.prisma.commission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    return this.toAdmin(row);
  }

  async decide(id: string, input: CommissionDecideDto) {
    const row = await this.prisma.commission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const current = this.toCommission(row.payload);
    const next = artistDecideCommission(current, input.decision, {
      reason: input.reason,
      alternative: input.alternative,
      change: input.change,
    });
    await this.prisma.commission.update({
      where: { id },
      data: { payload: next as unknown as Prisma.InputJsonValue },
    });
    const kind =
      input.decision === "approve"
        ? "commission_approved"
        : input.decision === "decline"
          ? "commission_declined"
          : "commission_change";
    await this.notices.createForOwner(row.ownerKey, kind, id);
    return this.toAdmin({ ...row, payload: next as unknown as Prisma.JsonValue });
  }

  async addArtistMessage(id: string, body: LocaleCopy, internal?: boolean) {
    const row = await this.prisma.commission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const current = this.toCommission(row.payload);
    const next = addCommissionMessage(current, { author: "artist", body, internal });
    await this.prisma.commission.update({
      where: { id },
      data: { payload: next as unknown as Prisma.InputJsonValue },
    });
    if (!internal) {
      await this.notices.createForOwner(row.ownerKey, "commission_message", id);
    }
    return this.toAdmin({ ...row, payload: next as unknown as Prisma.JsonValue });
  }

  async saveAdmin(id: string, payload: MakingCommission) {
    const row = await this.prisma.commission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const next = { ...payload, id, updatedAt: Date.now() };
    await this.prisma.commission.update({
      where: { id },
      data: { payload: next as unknown as Prisma.InputJsonValue },
    });
    return this.toAdmin({ ...row, payload: next as unknown as Prisma.JsonValue });
  }

  private async requireOwned(actor: Actor, id: string) {
    const row = await this.prisma.commission.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    if (row.ownerKey !== this.identity.key(actor)) {
      throw new ForbiddenException("این سفارش متعلق به شما نیست.");
    }
    return row;
  }

  private toCommission(payload: Prisma.JsonValue): MakingCommission {
    return payload as unknown as MakingCommission;
  }

  private toAdmin(row: { id: string; ownerKey: string; payload: Prisma.JsonValue; createdAt: Date; updatedAt: Date }) {
    const payload = this.toCommission(row.payload);
    return {
      id: row.id,
      ownerKey: row.ownerKey,
      customerName: payload.customerName,
      artistName: payload.artistName,
      stage: payload.stage,
      nextActor: payload.nextActor,
      concept: payload.brief.concept,
      intendedUse: payload.brief.intendedUse,
      material: payload.brief.material,
      image: payload.brief.image ?? payload.brief.images?.[0],
      messages: payload.messages,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      payload,
    };
  }
}
