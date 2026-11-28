import { canAdmin } from "../admin/permissions";
import { AdminGuard } from "../common/guards/admin.guard";
import type { AuthedRequest } from "../common/session.middleware";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { SaveCategoryDto } from "./dto/save-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

/** Same permission as product writes. Viewing the list is open to every staff role. */
export function assertCategoryWrite(role: string | undefined) {
  if (!canAdmin(role, "product.write")) {
    throw new ForbiddenException("برای این عملیات دسترسی ندارید.");
  }
}

@Controller("admin/categories")
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listAdmin();
  }

  @Post()
  create(@Body() body: SaveCategoryDto, @Req() request: AuthedRequest) {
    assertCategoryWrite(request.adminRole);
    return this.categories.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: UpdateCategoryDto,
    @Req() request: AuthedRequest,
  ) {
    assertCategoryWrite(request.adminRole);
    return this.categories.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: AuthedRequest) {
    assertCategoryWrite(request.adminRole);
    return this.categories.remove(id);
  }
}
