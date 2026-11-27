import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { ExchangeRateRepository } from '../../domain/repositories/exchange-rate.repository';
import { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import { ExchangeRateProvider } from '../ports/exchange-rate-provider.port';
import { SyncExchangeRateUseCase } from './sync-exchange-rate.entity';

describe('SyncExchangeRateUseCase', () => {
  let useCase: SyncExchangeRateUseCase;
  let provider: jest.Mocked<ExchangeRateProvider>;
  let repository: jest.Mocked<ExchangeRateRepository>;
  let cache: jest.Mocked<ExchangeRateCache>;

  beforeEach(() => {
    provider = {
      fetchCurrentRate: jest.fn(),
    };
    repository = {
      save: jest.fn(),
      findLatest: jest.fn(),
    };
    cache = {
      getLatest: jest.fn(),
      setLatest: jest.fn(),
    };

    useCase = new SyncExchangeRateUseCase(provider, repository, cache);
  });

  it('should fetch rate from SUNAT provider, persist in repository, and update cache', async () => {
    provider.fetchCurrentRate.mockResolvedValue({
      compra: 3.733,
      venta: 3.739,
      origen: 'SUNAT',
      moneda: 'USD',
      fecha: '2026-11-27',
    });

    const savedRate = ExchangeRate.create({
      id: 'rate-1',
      compra: 3.733,
      venta: 3.739,
      origen: 'SUNAT',
      moneda: 'USD',
      fechaProveedor: '2026-11-27',
    });
    repository.save.mockResolvedValue(savedRate);

    const result = await useCase.execute();

    expect(provider.fetchCurrentRate).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(cache.setLatest).toHaveBeenCalledWith(savedRate);
    expect(result).toEqual(savedRate);
  });
});
