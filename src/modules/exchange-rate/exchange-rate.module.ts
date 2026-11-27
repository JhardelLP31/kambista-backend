import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ExchangeRateMongoEntity, ExchangeRateSchema } from "./infrastructure/persistence/exchange-rate.schema";
import { SyncExchangeRateUseCase } from "./application/use-cases/sync-exchange-rate.entity";
import { GetLatestExchangeRateUseCase } from "./application/use-cases/get-latest-exchange-rate.use-case";
import { ExchangeRateScheduler } from "./infrastructure/schedulers/exchange-rate.scheduler";
import { EXCHANGE_RATE_REPOSITORY } from "./domain/repositories/exchange-rate.repository";
import { MongoExchangeRateRepository } from "./infrastructure/persistence/mongo-exchange-rate.repository";
import { EXCHANGE_RATE_PROVIDER } from "./application/ports/exchange-rate-provider.port";
import { SunatExchangeRateProvider } from "./infrastructure/providers/sunat-exchange-rate.provider";
import { EXCHANGE_RATE_CACHE } from "./application/ports/exchange-rate-cache.port";
import { MemoryExchangeRateCache } from "./infrastructure/cache/memory-exchange-rate.cache";



@Module({
    imports: [
        HttpModule,
        CacheModule.register(),
        MongooseModule.forFeature([
            { name: ExchangeRateMongoEntity.name, schema: ExchangeRateSchema },
        ]),
    ],
    providers: [
        SyncExchangeRateUseCase,
        GetLatestExchangeRateUseCase,
        ExchangeRateScheduler,
        {
            provide: EXCHANGE_RATE_REPOSITORY,
            useClass: MongoExchangeRateRepository,
        },
        {
            provide: EXCHANGE_RATE_PROVIDER,
            useClass: SunatExchangeRateProvider,
        },
        {
            provide: EXCHANGE_RATE_CACHE,
            useClass: MemoryExchangeRateCache,
        },
    ],
    exports: [GetLatestExchangeRateUseCase],
})

export class ExchangeRateModule { }