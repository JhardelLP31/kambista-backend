import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainErrorCode, DomainException, } from '../../domain/exceptions/domain.exception';

const DOMAIN_ERROR_STATUS_MAP: Record<DomainErrorCode, HttpStatus> = {
    [DomainErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
    [DomainErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
    [DomainErrorCode.CONFLICT]: HttpStatus.CONFLICT,
    [DomainErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
    [DomainErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
    [DomainErrorCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (exception instanceof DomainException) {
            const status = DOMAIN_ERROR_STATUS_MAP[exception.code];
            response.status(status).json({
                statusCode: status,
                error: exception.code,
                message: exception.message,
                path: request.url,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message =
                typeof exceptionResponse === 'object' &&
                    exceptionResponse !== null &&
                    'message' in exceptionResponse
                    ? (exceptionResponse as { message: unknown }).message
                    : exception.message;

            response.status(status).json({
                statusCode: status,
                error: exception.name,
                message,
                path: request.url,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        this.logger.error(
            `Unexpected error on ${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : String(exception),
        );

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno del servidor',
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}