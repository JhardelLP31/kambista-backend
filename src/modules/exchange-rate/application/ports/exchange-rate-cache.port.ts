import { ExchangeRate } from "../../domain/entities/exchange-rate.entity";


export const EXCHANGE_RATE_CACHE = Symbol('EXCHANGE_RATE_CACHE');

export interface ExchangeRateCache {
    getLatest(): Promise<ExchangeRate | null>;
    setLatest(rate: ExchangeRate): Promise<void>;
}

