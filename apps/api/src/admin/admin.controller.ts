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
import { InviteMemberDto, SaveProductDto, UpdateMemberDto, UpdateOrderDto } from "./dto";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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
