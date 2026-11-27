export const EXCHANGE_RATE_READER = Symbol('EXCHANGE_RATE_READER');

export interface CurrentExchangeRate {
  compra: number;
  venta: number;
}

export interface ExchangeRateReader {
  getLatestRate(): Promise<CurrentExchangeRate>;
}
