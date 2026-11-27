import { ExchangeRate } from '../entities/exchange-rate.entity';

export const EXCHANGE_RATE_REPOSITORY = Symbol('EXCHANGE_RATE_REPOSITORY');

export interface ExchangeRateRepository {
  save(exchangeRate: ExchangeRate): Promise<ExchangeRate>;
  findLatest(): Promise<ExchangeRate | null>;
}