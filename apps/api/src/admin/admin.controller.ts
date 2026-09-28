import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { AdminService } from "./admin.service";
import {
  InviteMemberDto,
  RejectPaymentDto,
  SaveProductDto,
  UpdateMemberDto,
  UpdateOrderDto,
} from "./dto";
import { CommissionsService } from "../commissions/commissions.service";
import {
  CommissionDecideDto,
  CommissionMessageDto,
  SaveCommissionDto,
} from "../commissions/dto";
import { ContactService } from "../contact/contact.service";
import { UpdateContactMessageDto } from "../contact/dto";
import { DamageReportsService } from "../damage/damage-reports.service";
import { ReviewDamageReportDto } from "../damage/dto";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly commissions: CommissionsService,
    private readonly contact: ContactService,
    private readonly damageReports: DamageReportsService,
  ) {}

  @Get("products")
  listProducts() {
    return this.admin.listProducts();
  }

  @Post("products")
  createProduct(@Body() body: SaveProductDto, @Req() request: AuthedRequest) {
    this.admin.assert(request.adminRole, "product.write");
    return this.admin.saveProduct(body);
  }

  @Patch("products/:id")
  updateProduct(
    @Param("id") id: string,
    @Body() body: SaveProductDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "product.write");
    return this.admin.saveProduct(body, id);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string, @Req() request: AuthedRequest) {
    this.admin.assert(request.adminRole, "product.delete");
    return this.admin.deleteProduct(id);
  }

  @Get("orders")
  listOrders() {
    return this.admin.listOrders();
  }

  @Patch("orders/:id")
  updateOrder(
    @Param("id") id: string,
    @Body() body: UpdateOrderDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.admin.updateOrder(id, body);
  }

  /** Receipt matches the order: confirm it, sell the work, notify the buyer. */
  @Post("orders/:id/payment/approve")
  approvePayment(@Param("id") id: string, @Req() request: AuthedRequest) {
    this.admin.assert(request.adminRole, "order.write");
    return this.admin.approvePayment(id, request.userId ?? null);
  }

  /** Receipt refused: order becomes `rejected` and the work goes back on sale. */
  @Post("orders/:id/payment/reject")
  rejectPayment(
    @Param("id") id: string,
    @Body() body: RejectPaymentDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.admin.rejectPayment(id, body.reason, request.userId ?? null);
  }

  @Get("messages")
  listMessages() {
    return this.contact.listAll();
  }

  @Patch("messages/:id")
  updateMessage(
    @Param("id") id: string,
    @Body() body: UpdateContactMessageDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.contact.setStatus(id, body.status);
  }

  @Get("damage-reports")
  listDamageReports() {
    return this.damageReports.listAll();
  }

  /** Approve with a resolution, decline with a reason, or mark as being reviewed. */
  @Patch("damage-reports/:id")
  reviewDamageReport(
    @Param("id") id: string,
    @Body() body: ReviewDamageReportDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.damageReports.review(id, body, request.userId ?? null);
  }

  @Get("commissions")
  listCommissions() {
    return this.commissions.listAll();
  }

  @Get("commissions/:id")
  getCommission(@Param("id") id: string) {
    return this.commissions.getAdmin(id);
  }

  @Patch("commissions/:id")
  saveCommission(
    @Param("id") id: string,
    @Body() body: SaveCommissionDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.commissions.saveAdmin(id, body.payload);
  }

  @Post("commissions/:id/review")
  beginCommissionReview(
    @Param("id") id: string,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.commissions.beginReview(id);
  }

  @Post("commissions/:id/decide")
  decideCommission(
    @Param("id") id: string,
    @Body() body: CommissionDecideDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.commissions.decide(id, body);
  }

  @Post("commissions/:id/messages")
  messageCommission(
    @Param("id") id: string,
    @Body() body: CommissionMessageDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "order.write");
    return this.commissions.addArtistMessage(id, body.body, body.internal);
  }

  @Get("users")
  listUsers() {
    return this.admin.listUsers();
  }

  @Get("members")
  listMembers() {
    return this.admin.listMembers();
  }

  @Post("members")
  inviteMember(@Body() body: InviteMemberDto, @Req() request: AuthedRequest) {
    this.admin.assert(request.adminRole, "member.write");
    return this.admin.inviteMember(body);
  }

  @Patch("members/:id")
  updateMember(
    @Param("id") id: string,
    @Body() body: UpdateMemberDto,
    @Req() request: AuthedRequest,
  ) {
    this.admin.assert(request.adminRole, "member.write");
    return this.admin.updateMember(id, body);
  }
}
