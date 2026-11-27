import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { Currency, Transaction } from './transaction.entity';

describe('Transaction Entity', () => {
  it('should convert USD to PEN using venta rate', () => {
    const tx = Transaction.createFromExchange({
      userId: 'user-123',
      monedaOrigen: Currency.USD,
      monedaDestino: Currency.PEN,
      monto: 100,
      compra: 3.733,
      venta: 3.739,
    });

    expect(tx.montoCambiado).toBe(373.9);
    expect(tx.tipoCambio).toBe(3.739);
  });

  it('should convert PEN to USD using compra rate rounded to 2 decimals', () => {
    const tx = Transaction.createFromExchange({
      userId: 'user-123',
      monedaOrigen: Currency.PEN,
      monedaDestino: Currency.USD,
      monto: 100,
      compra: 3.733,
      venta: 3.739,
    });

    expect(tx.tipoCambio).toBe(3.733);
    expect(tx.montoCambiado).toBe(26.79);
  });

  it('should reject identical origin and destination currencies', () => {
    expect(() =>
      Transaction.createFromExchange({
        userId: 'user-123',
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.USD,
        monto: 100,
        compra: 3.733,
        venta: 3.739,
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should reject amounts <= 0', () => {
    expect(() =>
      Transaction.createFromExchange({
        userId: 'user-123',
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 0,
        compra: 3.733,
        venta: 3.739,
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should reject amounts with more than 2 decimals', () => {
    expect(() =>
      Transaction.createFromExchange({
        userId: 'user-123',
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 10.123,
        compra: 3.733,
        venta: 3.739,
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should reject amounts exceeding 7 integer digits', () => {
    expect(() =>
      Transaction.createFromExchange({
        userId: 'user-123',
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 10_000_000,
        compra: 3.733,
        venta: 3.739,
      }),
    ).toThrow(ValidationDomainException);
  });
});
