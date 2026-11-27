import { ArgumentsHost, BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import {
  ConflictDomainException,
  ExternalServiceDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
  UnauthorizedDomainException,
  ValidationDomainException,
} from '../../domain/exceptions/domain.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ method: 'POST', url: '/v1/transactions' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it.each([
    [new ValidationDomainException('Dato inválido'), HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR'],
    [new NotFoundDomainException('No encontrado'), HttpStatus.NOT_FOUND, 'NOT_FOUND'],
    [new ConflictDomainException('Ya existe'), HttpStatus.CONFLICT, 'CONFLICT'],
    [new UnauthorizedDomainException('No autorizado'), HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED'],
    [new ForbiddenDomainException('Prohibido'), HttpStatus.FORBIDDEN, 'FORBIDDEN'],
    [new ExternalServiceDomainException('SUNAT caída'), HttpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE'],
  ])('should map domain exception %p to HTTP %i', (exception, expectedStatus, expectedCode) => {
    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(expectedStatus);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expectedStatus,
        error: expectedCode,
        message: exception.message,
        path: '/v1/transactions',
      }),
    );
  });

  it('should preserve HttpException status and message array', () => {
    const exception = new BadRequestException(['campo requerido']);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['campo requerido'],
      }),
    );
  });

  it('should hide internal details for unexpected errors and return 500', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(new Error('Mongo connection refused'), host);

    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
      }),
    );

    loggerSpy.mockRestore();
  });
});
