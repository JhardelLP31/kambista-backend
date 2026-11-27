import { NotFoundDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { ExchangeRateRepository } from '../../domain/repositories/exchange-rate.repository';
import { ExchangeRateCache } from '../ports/exchange-rate-cache.port';
import { GetLatestExchangeRateUseCase } from './get-latest-exchange-rate.use-case';

describe('GetLatestExchangeRateUseCase', () => {
  let useCase: GetLatestExchangeRateUseCase;
  let repository: jest.Mocked<ExchangeRateRepository>;
  let cache: jest.Mocked<ExchangeRateCache>;

  const sampleRate = ExchangeRate.create({
    id: 'rate-1',
    compra: 3.733,
    venta: 3.739,
    origen: 'SUNAT',
    moneda: 'USD',
    fechaProveedor: '2026-11-27',
  });

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findLatest: jest.fn(),
    };
    cache = {
      getLatest: jest.fn(),
      setLatest: jest.fn(),
    };

    useCase = new GetLatestExchangeRateUseCase(repository, cache);
  });

  it('should return cached rate without querying repository on cache hit', async () => {
    cache.getLatest.mockResolvedValue(sampleRate);

    const result = await useCase.execute();

    expect(result).toEqual(sampleRate);
    expect(repository.findLatest).not.toHaveBeenCalled();
  });

  it('should query repository and warm cache on cache miss', async () => {
    cache.getLatest.mockResolvedValue(null);
    repository.findLatest.mockResolvedValue(sampleRate);

    const result = await useCase.execute();

    expect(repository.findLatest).toHaveBeenCalledTimes(1);
    expect(cache.setLatest).toHaveBeenCalledWith(sampleRate);
    expect(result).toEqual(sampleRate);
  });

  it('should throw NotFoundDomainException when neither cache nor DB has a rate', async () => {
    cache.getLatest.mockResolvedValue(null);
    repository.findLatest.mockResolvedValue(null);

    await expect(useCase.execute()).rejects.toThrow(NotFoundDomainException);
  });
});
