import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

type RequestWithContext = Request & { requestId?: string; user?: { id: string } };

export function requestLogger(request: RequestWithContext, response: Response, next: NextFunction) {
  const requestId = request.header('X-Request-Id')?.slice(0, 80) || randomUUID();
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  const startedAt = Date.now();
  response.on('finish', () => {
    console.log(JSON.stringify({ requestId, method: request.method, route: request.originalUrl, statusCode: response.statusCode, durationMs: Date.now() - startedAt, userId: request.user?.id }));
  });
  next();
}
