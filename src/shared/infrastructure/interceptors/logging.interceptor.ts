import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

interface AuthenticatedRequest extends Request {
  user?: { id?: string; rol?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const userId = request.user?.id ?? 'anonymous';
          this.logger.log(
            JSON.stringify({
              method: request.method,
              path: request.originalUrl,
              statusCode: response.statusCode,
              userId,
              durationMs,
            }),
          );
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startTime;
          const userId = request.user?.id ?? 'anonymous';
          this.logger.warn(
            JSON.stringify({
              method: request.method,
              path: request.originalUrl,
              userId,
              durationMs,
              error: err instanceof Error ? err.message : 'Unknown error',
            }),
          );
        },
      }),
    );
  }
}