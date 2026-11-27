import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../auth/infrastructure/strategies/jwt.strategy';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionHistoryUseCase } from '../../application/use-cases/get-transaction-history.use-case';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { GetHistoryQueryDto } from '../dto/get-history-query.dto';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@Controller('v1/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una solicitud de cambio de divisas' })
  @ApiCreatedResponse({
    description: 'Transacción creada y calculada con el tipo de cambio más reciente',
    schema: {
      example: {
        id: '6746b2b3f1d2e3a4b5c6d7e9',
        monedaOrigen: 'USD',
        monedaDestino: 'PEN',
        monto: 100,
        montoCambiado: 373.9,
        tipoCambio: 3.739,
        fecha: '2026-11-27T14:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Monedas iguales, monto inválido o formato incorrecto',
  })
  @ApiNotFoundResponse({
    description: 'No existe un tipo de cambio registrado en el sistema',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.createTransactionUseCase.execute({
      userId: user.id,
      monedaOrigen: dto.monedaOrigen,
      monedaDestino: dto.monedaDestino,
      monto: dto.monto,
    });
  }

  @Get('history')
  @ApiOperation({
    summary: 'Consultar historial de transacciones por rango de fechas',
    description:
      'El rol user siempre visualiza solo su historial. El rol admin puede enviar userId opcional para consultar el de otro usuario. Si se envía page o limit, responde con paginación.',
  })
  @ApiOkResponse({
    description: 'Listado de transacciones (array o paginado si se envían page/limit)',
    schema: {
      example: [
        {
          id: '6746b2b3f1d2e3a4b5c6d7e9',
          monedaOrigen: 'USD',
          monedaDestino: 'PEN',
          monto: 100,
          montoCambiado: 373.9,
          tipoCambio: 3.739,
          fecha: '2026-11-27T14:00:00.000Z',
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Rango de fechas o userId inválido' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente' })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetHistoryQueryDto,
  ) {
    return this.getTransactionHistoryUseCase.execute({
      requesterId: user.id,
      isAdmin: user.rol === UserRole.ADMIN,
      startDate: query.startDate,
      endDate: query.endDate,
      targetUserId: query.userId,
      page: query.page,
      limit: query.limit,
    });
  }
}
