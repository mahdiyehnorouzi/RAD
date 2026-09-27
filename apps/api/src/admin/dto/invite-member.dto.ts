import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString, MinLength } from "class-validator";

export class InviteMemberDto {
  @ApiProperty({ example: "Sara Ahmadi" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "editor@rad.studio" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "editor", enum: ["manager", "editor", "viewer"] })
  @IsIn(["manager", "editor", "viewer"])
  role!: "manager" | "editor" | "viewer";
}
