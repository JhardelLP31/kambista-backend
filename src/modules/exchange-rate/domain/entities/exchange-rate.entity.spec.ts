import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { ExchangeRate } from './exchange-rate.entity';

describe('ExchangeRate Entity', () => {
  it('should create a valid ExchangeRate entity', () => {
    const rate = ExchangeRate.create({
      compra: 3.733,
      venta: 3.739,
      origen: 'SUNAT',
      moneda: 'USD',
      fechaProveedor: '2026-11-27',
    });

    expect(rate.compra).toBe(3.733);
    expect(rate.venta).toBe(3.739);
    expect(rate.origen).toBe('SUNAT');
    expect(rate.moneda).toBe('USD');
    expect(rate.createdAt).toBeInstanceOf(Date);
  });

  it('should throw ValidationDomainException when compra is <= 0', () => {
    expect(() =>
      ExchangeRate.create({
        compra: 0,
        venta: 3.739,
        origen: 'SUNAT',
        moneda: 'USD',
        fechaProveedor: '2026-11-27',
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should throw ValidationDomainException when venta is negative or NaN', () => {
    expect(() =>
      ExchangeRate.create({
        compra: 3.733,
        venta: Number.NaN,
        origen: 'SUNAT',
        moneda: 'USD',
        fechaProveedor: '2026-11-27',
      }),
    ).toThrow(ValidationDomainException);
  });

  it('should throw ValidationDomainException when origen or moneda is empty', () => {
    expect(() =>
      ExchangeRate.create({
        compra: 3.733,
        venta: 3.739,
        origen: '   ',
        moneda: 'USD',
        fechaProveedor: '2026-11-27',
      }),
    ).toThrow(ValidationDomainException);
  });
});
