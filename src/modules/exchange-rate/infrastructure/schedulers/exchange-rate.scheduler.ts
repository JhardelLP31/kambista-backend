import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SyncExchangeRateUseCase } from "../../application/use-cases/sync-exchange-rate.entity";
import { Cron } from "@nestjs/schedule";



@Injectable()
export class ExchangeRateScheduler implements OnModuleInit {
    private readonly logger = new Logger(ExchangeRateScheduler.name);

    constructor(
        private readonly syncExchangeRateUseCase: SyncExchangeRateUseCase,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.handleSync();
    }

    @Cron('*/30 * * * * *')
    async handleSync(): Promise<void> {
        try {
            const rate = await this.syncExchangeRateUseCase.execute();
            this.logger.log(
                `Tipo de cambio sincronizado -> compra: ${rate.compra}, venta: ${rate.venta} (${rate.fechaProveedor})`,
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Fallo al sincronizar tipo de cambio SUNAT: ${message}`);
        }
    }
}