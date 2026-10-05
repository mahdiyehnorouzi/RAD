import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ConfirmPaymentDto {
  @ApiProperty({
    example:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
    description: "Bank transfer receipt image as a base64 data URL",
  })
  @IsString({ message: "تصویر رسید نامعتبر است." })
  @MinLength(32, { message: "تصویر رسید نامعتبر است." })
  receiptImage!: string;

  @ApiPropertyOptional({
    example: "123456789012",
    description: "Bank transfer tracking / reference number (شماره پیگیری)",
  })
  @IsString({ message: "شماره پیگیری نامعتبر است." })
  @IsOptional()
  // This is a payload sanity bound only, not the business rule: the service
  // normalizes (strips spaces/dashes) and requires 4-32 alnum chars. 40 raw
  // characters comfortably covers every legitimately formatted number while
  // still rejecting pasted-in junk before it reaches that logic. Keep the
  // real rule single-sourced in `normalizeTrackingNumber`.
  @MaxLength(40, { message: "شماره پیگیری خیلی طولانی است." })
  trackingNumber?: string;
}
