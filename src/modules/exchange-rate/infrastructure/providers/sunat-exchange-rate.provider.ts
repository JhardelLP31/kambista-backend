import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ExternalServiceDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import {
  ExchangeRateProvider,
  ExternalExchangeRateData,
} from '../../application/ports/exchange-rate-provider.port';

@Injectable()

export class SunatExchangeRateProvider implements ExchangeRateProvider {
    private readonly apiUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.apiUrl = this.configService.getOrThrow<string>('SUNAT_API_URL');
    }

    async fetchCurrentRate(): Promise<ExternalExchangeRateData> {
        const response = await firstValueFrom(
            this.httpService.get<ExternalExchangeRateData>(this.apiUrl).pipe(
                timeout(5000),
                catchError((error: unknown) => {
                    const message = error instanceof Error ? error.message : 'Error al consultar API SUNAT';
                    throw new ExternalServiceDomainException(
                        `No se pudo obtener el tipo de cambio de SUNAT: ${message}`,
                    );
                }),
            ),
        )

        const data = response.data;
        if (
            !data ||
            typeof data.compra !== 'number' ||
            typeof data.venta !== 'number'
        ) {
            throw new ExternalServiceDomainException(
                'Respuesta inválida del proveedor de tipo de cambio SUNAT',
            );
        }

        return data;
    }
}