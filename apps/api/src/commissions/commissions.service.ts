import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Commission } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import { noticeForStageChange } from "../notices/notice-kinds";
import type { Actor } from "../common/identity";
import { createSubmittedCommission } from "./commission.factory";
import {
  addCommissionMessage,
  artistDecideCommission,
  beginCommissionReview,
} from "./commission.mutate";
import type { LocaleCopy, MakingCommission } from "./commission.types";
import type { CommissionDecideDto, CreateCommissionDto } from "./dto";

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(Commission)
    private readonly commissions: Repository<Commission>,
    private readonly identity: IdentityService,
    private readonly notices: NoticesService,
  ) {}

  async listMine(actor: Actor) {
    if (!actor.user) return [];
    const rows = await this.commissions.find({
      where: { ownerKey: this.identity.key(actor) },
      order: { updatedAt: "DESC" },
    });
    return rows.map((row) => this.toCommission(row.payload));
  }

  async listWorkshop(actor: Actor) {
    this.requireMaker(actor);
    const rows = await this.commissions.find({
      order: { updatedAt: "DESC" },
    });
    return rows.map((row) => this.toCommission(row.payload));
  }

  async getMine(actor: Actor, id: string) {
    this.requireSignedIn(actor);
    return this.toCommission((await this.requireOwned(actor, id)).payload);
  }

  async create(actor: Actor, input: CreateCommissionDto) {
    this.requireSignedIn(actor);
    const payload = createSubmittedCommission({
      customerName: input.customerName,
      brief: input.brief,
      title: input.title,
    });
    await this.commissions.save(
      this.commissions.create({
        id: payload.id,
        ownerKey: this.identity.key(actor),
        payload,
      }),
    );
    return payload;
  }

  async saveMine(actor: Actor, id: string, payload: MakingCommission) {
    this.requireSignedIn(actor);
    const row = await this.requireOwned(actor, id);
    const previous = this.toCommission(row.payload);
    const next = { ...payload, id: row.id, updatedAt: Date.now() };
    await this.commissions.update({ id }, { payload: next });
    await this.emitStageNotice(row.ownerKey, previous.stage, next.stage, id);
    return next;
  }

  async saveWorkshop(actor: Actor, id: string, payload: MakingCommission) {
    this.requireMaker(actor);
    return this.saveAdmin(id, payload).then((row) => row.payload);
  }

  async addMineMessage(actor: Actor, id: string, body: LocaleCopy) {
    this.requireSignedIn(actor);
    const current = this.toCommission((await this.requireOwned(actor, id)).payload);
    const next = addCommissionMessage(current, { author: "customer", body });
    await this.commissions.update({ id }, { payload: next });
    return next;
  }

  async listAll() {
    const rows = await this.commissions.find({ order: { updatedAt: "DESC" } });
    return rows.map((row) => this.toAdmin(row));
  }

  async getAdmin(id: string) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    return this.toAdmin(row);
  }

  async beginReview(id: string) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const current = this.toCommission(row.payload);
    const next = beginCommissionReview(current);
    if (next === current) return this.toAdmin(row);
    await this.commissions.update({ id }, { payload: next });
    return this.toAdmin({ ...row, payload: next });
  }

  async decide(id: string, input: CommissionDecideDto) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    let current = this.toCommission(row.payload);
    if (current.stage === "design_submitted") {
      current = beginCommissionReview(current);
    }
    const next = artistDecideCommission(current, input.decision, {
      reason: input.reason,
      alternative: input.alternative,
      change: input.change,
    });
    await this.commissions.update({ id }, { payload: next });
    const kind =
      input.decision === "approve"
        ? "commission_approved"
        : input.decision === "decline"
          ? "commission_declined"
          : "commission_change";
    await this.notices.createForOwner(row.ownerKey, kind, id);
    return this.toAdmin({ ...row, payload: next });
  }

  async addArtistMessage(id: string, body: LocaleCopy, internal?: boolean) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const current = this.toCommission(row.payload);
    const next = addCommissionMessage(current, { author: "artist", body, internal });
    await this.commissions.update({ id }, { payload: next });
    if (!internal) {
      await this.notices.createForOwner(row.ownerKey, "commission_message", id);
    }
    return this.toAdmin({ ...row, payload: next });
  }

  async saveAdmin(id: string, payload: MakingCommission) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const previous = this.toCommission(row.payload);
    const next = { ...payload, id, updatedAt: Date.now() };
    await this.commissions.update({ id }, { payload: next });
    await this.emitStageNotice(row.ownerKey, previous.stage, next.stage, id);
    return this.toAdmin({ ...row, payload: next });
  }

  private async emitStageNotice(
    ownerKey: string,
    previousStage: string | undefined,
    nextStage: string,
    commissionId: string,
  ) {
    const kind = noticeForStageChange(previousStage, nextStage);
    if (!kind) return;
    await this.notices.createForOwner(ownerKey, kind, commissionId);
  }

  private requireSignedIn(actor: Actor) {
    if (!actor.user) {
      throw new UnauthorizedException("برای مشاهده این سفارش وارد حساب شوید.");
    }
  }

  private requireMaker(actor: Actor) {
    this.requireSignedIn(actor);
    const role = actor.user?.role;
    const adminRole = actor.user?.adminRole;
    const isMaker =
      role === "artist" ||
      adminRole === "owner" ||
      adminRole === "manager" ||
      adminRole === "editor";
    if (!isMaker) {
      throw new ForbiddenException("این کارگاه فقط برای هنرمند در دسترس است.");
    }
  }

  private async requireOwned(actor: Actor, id: string) {
    const row = await this.commissions.findOne({ where: { id } });
    if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
    const ownerKey = this.identity.key(actor);
    const userKey = actor.user ? `user:${actor.user.id}` : "";
    if (row.ownerKey !== ownerKey && row.ownerKey !== userKey) {
      throw new ForbiddenException("این سفارش متعلق به شما نیست.");
    }
    return row;
  }

  private toCommission(payload: unknown): MakingCommission {
    return payload as MakingCommission;
  }

  private toAdmin(row: {
    id: string;
    ownerKey: string;
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
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
