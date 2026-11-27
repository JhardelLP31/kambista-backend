import { Inject, Injectable } from "@nestjs/common";
import { EXCHANGE_RATE_PROVIDER, ExchangeRateProvider } from "../ports/exchange-rate-provider.port";
import { EXCHANGE_RATE_REPOSITORY, ExchangeRateRepository } from "../../domain/repositories/exchange-rate.repository";
import { EXCHANGE_RATE_CACHE, ExchangeRateCache } from "../ports/exchange-rate-cache.port";
import { ExchangeRate } from "../../domain/entities/exchange-rate.entity";




@Injectable()
export class SyncExchangeRateUseCase {
    constructor(
        @Inject(EXCHANGE_RATE_PROVIDER)
        private readonly provider: ExchangeRateProvider,
        @Inject(EXCHANGE_RATE_REPOSITORY)
        private readonly repository: ExchangeRateRepository,
        @Inject(EXCHANGE_RATE_CACHE)
        private readonly cache: ExchangeRateCache,
    ){}

    async execute(): Promise<ExchangeRate> {
        const externalData = await this.provider.fetchCurrentRate();

        const exchangeRate = ExchangeRate.create({
            compra: externalData.compra,
            venta: externalData.venta,
            origen: externalData.origen,
            moneda: externalData.moneda,
            fechaProveedor:  externalData.fecha,
        });

        const saved = await this.repository.save(exchangeRate);
        await this.cache.setLatest(saved);

        return saved;
    }
}