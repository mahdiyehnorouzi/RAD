import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Commission } from "../database/entities";
import { IdentityService } from "../common/identity.service";
import { NoticesService } from "../notices/notices.service";
import { noticeForStageChange } from "../notices/notice-kinds";
import type { Actor } from "../common/identity";
import { COMMISSION_POLICY_SLUGS } from "../policies/const";
import { acceptedPolicyVersions } from "../policies/policy-acceptance";
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
    return rows.map((row) => this.toCustomer(row.payload));
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
    return this.toCustomer((await this.requireOwned(actor, id)).payload);
  }

  async create(actor: Actor, input: CreateCommissionDto) {
    this.requireSignedIn(actor);
    const versions = acceptedPolicyVersions(
      input.acceptedPolicies,
      COMMISSION_POLICY_SLUGS,
      "برای ارسال سفارش، شرایط سفارش اختصاصی را بخوان و تیک پذیرش را بزن.",
    );
    const payload = createSubmittedCommission({
      customerName: input.customerName,
      brief: input.brief,
      title: input.title,
      policyAcceptance: { versions, acceptedAt: Date.now() },
    });
    await this.commissions.save(
      this.commissions.create({
        id: payload.id,
        ownerKey: this.identity.key(actor),
        payload,
      }),
    );
    return this.toCustomer(payload);
  }

  async saveMine(actor: Actor, id: string, payload: MakingCommission) {
    this.requireSignedIn(actor);
    const row = await this.requireOwned(actor, id);
    // Customer saves may update the editable brief only. Never trust a client
    // to write workflow state, payments, audit entries, or internal notes.
    const current = this.toCommission(row.payload);
    const next = {
      ...current,
      title: payload.title,
      customerName: payload.customerName,
      brief: payload.brief,
      id: row.id,
      updatedAt: Date.now(),
    };
    await this.commissions.update({ id }, { payload: next });
    return this.toCustomer(next);
  }

  async saveWorkshop(actor: Actor, id: string, payload: MakingCommission) {
    this.requireMaker(actor);
    return this.saveAdmin(id, payload).then((row) => row.payload);
  }

  async addMineMessage(actor: Actor, id: string, body: LocaleCopy) {
    this.requireSignedIn(actor);
    await this.requireOwned(actor, id);
    const { next } = await this.mutateCommission(id, (current) =>
      addCommissionMessage(current, { author: "customer", body }),
    );
    return this.toCustomer(next);
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
    const { row, next } = await this.mutateCommission(id, (current) =>
      beginCommissionReview(current),
    );
    return this.toAdmin({ ...row, payload: next });
  }

  async decide(id: string, input: CommissionDecideDto) {
    const { row, next } = await this.mutateCommission(id, (current) => {
      const started =
        current.stage === "design_submitted"
          ? beginCommissionReview(current)
          : current;
      return artistDecideCommission(started, input.decision, {
        reason: input.reason,
        alternative: input.alternative,
        change: input.change,
      });
    });
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
    const { row, next } = await this.mutateCommission(id, (current) =>
      addCommissionMessage(current, { author: "artist", body, internal }),
    );
    if (!internal) {
      await this.notices.createForOwner(row.ownerKey, "commission_message", id);
    }
    return this.toAdmin({ ...row, payload: next });
  }

  async saveAdmin(id: string, payload: MakingCommission) {
    const { row, previous, next } = await this.mutateCommission(id, () => ({
      ...payload,
      id,
      updatedAt: Date.now(),
    }));
    await this.emitStageNotice(row.ownerKey, previous.stage, next.stage, id);
    return this.toAdmin({ ...row, payload: next });
  }

  /**
   * Every write here was read -> compute `next` in JS -> blind update(),
   * with no lock of any kind — two concurrent writers (two admins, or an
   * admin and the customer messaging at once) could both read the same
   * row, and whichever update() landed second silently clobbered the
   * first's message/stage/audit entry with an older snapshot (lost
   * update). A row lock inside a transaction serializes concurrent
   * mutations of the same commission instead: the second writer's
   * `SELECT ... FOR UPDATE` blocks until the first transaction commits,
   * then reads the genuinely-current row — the same pattern
   * `OrdersService` already uses for order rows. (An optimistic
   * updatedAt-matches retry was tried first; two writers racing in close
   * lockstep could keep re-colliding past a bounded retry count — this
   * doesn't have that failure mode.)
   */
  private async mutateCommission(
    id: string,
    mutate: (current: MakingCommission, row: Commission) => MakingCommission,
  ): Promise<{
    row: Commission;
    previous: MakingCommission;
    next: MakingCommission;
  }> {
    return this.commissions.manager.transaction(async (manager) => {
      const row = await manager.getRepository(Commission).findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!row) throw new NotFoundException("سفارش اختصاصی پیدا نشد.");
      const current = this.toCommission(row.payload);
      const next = mutate(current, row);
      if (next !== current) {
        await manager
          .getRepository(Commission)
          .update({ id }, { payload: next });
      }
      return { row, previous: current, next };
    });
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

  /** Customer-facing payload: internal notes and staff-only audit data never leave the API. */
  private toCustomer(
    payload: unknown,
  ): Omit<MakingCommission, "internalNotes"> {
    const commission = this.toCommission(payload);
    const { internalNotes: _internalNotes, ...customerPayload } = commission;
    return {
      ...customerPayload,
      messages: commission.messages.filter((message) => !message.internal),
    };
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
