export const EXCHANGE_RATE_PROVIDER = Symbol('EXCHANGE_RATE_PROVIDER');

export interface ExternalExchangeRateData {
    compra: number;
    venta: number;
    origen: string;
    moneda: string;
    fecha: string;
}

export interface ExchangeRateProvider {
    fetchCurrentRate(): Promise<ExternalExchangeRateData>;
}
