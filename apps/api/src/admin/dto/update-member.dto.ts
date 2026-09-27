import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";

export class UpdateMemberDto {
  @ApiPropertyOptional({
    example: "editor",
    enum: ["owner", "manager", "editor", "viewer"],
  })
  @IsOptional()
  @IsIn(["owner", "manager", "editor", "viewer"])
  role?: "owner" | "manager" | "editor" | "viewer";

  @ApiPropertyOptional({ example: "active", enum: ["active", "invited"] })
  @IsOptional()
  @IsIn(["active", "invited"])
  status?: "active" | "invited";
}
