import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException ? exception.getResponse() : "خطای داخلی سرور";
    const raw =
      typeof payload === "string"
        ? payload
        : ((payload as { message?: string | string[] }).message ?? "خطای داخلی سرور");
    const message = Array.isArray(raw) ? raw[0] : raw;
    response.status(status).json({ error: message, statusCode: status });
  }
}
