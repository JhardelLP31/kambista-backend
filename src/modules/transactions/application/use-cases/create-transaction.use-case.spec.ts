import { NotFoundDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { Currency, Transaction } from '../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../domain/repositories/transaction.repository';
import { ExchangeRateReader } from '../ports/exchange-rate-reader.port';
import { CreateTransactionUseCase } from './create-transaction.use-case';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let exchangeRateReader: jest.Mocked<ExchangeRateReader>;

  beforeEach(() => {
    transactionRepository = {
      save: jest.fn(),
      findHistory: jest.fn(),
    };
    exchangeRateReader = {
      getLatestRate: jest.fn(),
    };

    useCase = new CreateTransactionUseCase(
      transactionRepository,
      exchangeRateReader,
    );
  });

  it('should calculate exchange using latest rate, save transaction, and return response DTO', async () => {
    exchangeRateReader.getLatestRate.mockResolvedValue({
      compra: 3.733,
      venta: 3.739,
    });

    transactionRepository.save.mockImplementation(async (tx) =>
      Transaction.reconstitute({
        id: 'tx-1',
        userId: tx.userId,
        monedaOrigen: tx.monedaOrigen,
        monedaDestino: tx.monedaDestino,
        monto: tx.monto,
        montoCambiado: tx.montoCambiado,
        tipoCambio: tx.tipoCambio,
        fecha: new Date('2026-11-27T12:00:00.000Z'),
      }),
    );

    const result = await useCase.execute({
      userId: 'user-1',
      monedaOrigen: Currency.USD,
      monedaDestino: Currency.PEN,
      monto: 100,
    });

    expect(result).toEqual({
      id: 'tx-1',
      monedaOrigen: Currency.USD,
      monedaDestino: Currency.PEN,
      monto: 100,
      montoCambiado: 373.9,
      tipoCambio: 3.739,
      fecha: '2026-11-27T12:00:00.000Z',
    });
  });

  it('should propagate NotFoundDomainException when no exchange rate is available', async () => {
    exchangeRateReader.getLatestRate.mockRejectedValue(
      new NotFoundDomainException('Sin tipo de cambio'),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        monedaOrigen: Currency.USD,
        monedaDestino: Currency.PEN,
        monto: 100,
      }),
    ).rejects.toThrow(NotFoundDomainException);

    expect(transactionRepository.save).not.toHaveBeenCalled();
  });
});
