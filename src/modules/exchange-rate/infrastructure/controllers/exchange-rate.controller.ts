import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { GetLatestExchangeRateUseCase } from '../../application/use-cases/get-latest-exchange-rate.use-case';

@ApiTags('Exchange Rate')
@ApiBearerAuth('access-token')
@Controller('v1/exchange-rate')
@UseGuards(JwtAuthGuard)
export class ExchangeRateController {
  constructor(
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
  ) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Obtener el tipo de cambio SUNAT más reciente',
    description:
      'Consulta la caché en memoria y, en caso de miss, el último tipo de cambio persistido en MongoDB.',
  })
  @ApiOkResponse({
    description: 'Tipo de cambio actual obtenido correctamente',
    schema: {
      example: {
        compra: 3.733,
        venta: 3.739,
        origen: 'SUNAT',
        moneda: 'USD',
        fecha: '2026-11-27',
        actualizadoEn: '2026-11-27T14:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente' })
  async getLatest() {
    const rate = await this.getLatestExchangeRateUseCase.execute();
    return {
      compra: rate.compra,
      venta: rate.venta,
      origen: rate.origen,
      moneda: rate.moneda,
      fecha: rate.fechaProveedor,
      actualizadoEn:
        rate.createdAt instanceof Date
          ? rate.createdAt.toISOString()
          : new Date(rate.createdAt).toISOString(),
    };
  }
}
