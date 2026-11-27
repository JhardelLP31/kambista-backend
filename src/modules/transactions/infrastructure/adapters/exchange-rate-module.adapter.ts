import { Injectable } from '@nestjs/common';
import { GetLatestExchangeRateUseCase } from '../../../exchange-rate/application/use-cases/get-latest-exchange-rate.use-case';
import {
  CurrentExchangeRate,
  ExchangeRateReader,
} from '../../application/ports/exchange-rate-reader.port';

@Injectable()
export class ExchangeRateModuleAdapter implements ExchangeRateReader {
  constructor(
    private readonly getLatestExchangeRateUseCase: GetLatestExchangeRateUseCase,
  ) {}

  async getLatestRate(): Promise<CurrentExchangeRate> {
    const rate = await this.getLatestExchangeRateUseCase.execute();
    return {
      compra: rate.compra,
      venta: rate.venta,
    };
  }
}
