import { Inject, Injectable } from "@nestjs/common";
import { EXCHANGE_RATE_REPOSITORY, ExchangeRateRepository } from "../../domain/repositories/exchange-rate.repository";
import { EXCHANGE_RATE_CACHE, ExchangeRateCache } from "../ports/exchange-rate-cache.port";
import { ExchangeRate } from "../../domain/entities/exchange-rate.entity";
import { NotFoundDomainException } from "../../../../shared/domain/exceptions/domain.exception";



@Injectable()
export class GetLatestExchangeRateUseCase {
    constructor(
        @Inject(EXCHANGE_RATE_REPOSITORY)
        private readonly repository: ExchangeRateRepository,
        @Inject(EXCHANGE_RATE_CACHE)
        private readonly cache: ExchangeRateCache,
    ) {}

    async execute(): Promise<ExchangeRate> {
        const cached = await this.cache.getLatest();
        if (cached) {
            return cached;
        }
        
        const latest = await this.repository.findLatest();
        if(!latest) {
            throw new NotFoundDomainException(
                'No existe un tipo de cambio registrado en el sistema',
            );
        }

        await this.cache.setLatest(latest);
        return latest;

    }
}