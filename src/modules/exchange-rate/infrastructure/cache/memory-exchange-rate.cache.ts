import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { ExchangeRateCache } from '../../application/ports/exchange-rate-cache.port';
const LATEST_EXCHANGE_RATE_KEY = 'exchange_rate:latest';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class MemoryExchangeRateCache implements ExchangeRateCache {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

    async getLatest(): Promise<ExchangeRate | null> {
        const cached = await this.cacheManager.get<ExchangeRate>(LATEST_EXCHANGE_RATE_KEY);
        return cached ?? null;
    }

    async setLatest(rate: ExchangeRate): Promise<void> {
        await this.cacheManager.set(LATEST_EXCHANGE_RATE_KEY, rate, CACHE_TTL_MS);
    }
}