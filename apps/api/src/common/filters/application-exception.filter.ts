import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from '../errors/application-error';

type RequestWithContext = Request & { requestId?: string; user?: { id: string } };

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const requestId = request.requestId ?? 'unknown-request';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';

    if (exception instanceof ApplicationError) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = statusCode === HttpStatus.UNAUTHORIZED ? 'AUTHENTICATION_FAILED' : statusCode === HttpStatus.BAD_REQUEST ? 'VALIDATION_FAILED' : 'INTERNAL_ERROR';
      message = statusCode >= 500 ? 'An unexpected error occurred.' : this.httpMessage(exception.getResponse());
    }

    const logEntry = {
      requestId,
      method: request.method,
      route: request.originalUrl,
      userId: request.user?.id,
      code,
      statusCode,
      internalError: exception instanceof Error ? exception.message : String(exception)
    };
    if (statusCode >= 500) console.error(JSON.stringify(logEntry));
    else console.warn(JSON.stringify(logEntry));

    response.status(statusCode).json({ statusCode, code, message, requestId });
  }

  private httpMessage(payload: string | object): string {
    if (typeof payload === 'string') return payload;
    const body = payload as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    return 'The request could not be processed.';
  }
}
