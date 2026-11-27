import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { Currency, Transaction } from '../../domain/entities/transaction.entity';
import { TransactionRepository } from '../../domain/repositories/transaction.repository';
import { GetTransactionHistoryUseCase } from './get-transaction-history.use-case';

describe('GetTransactionHistoryUseCase', () => {
  let useCase: GetTransactionHistoryUseCase;
  let transactionRepository: jest.Mocked<TransactionRepository>;

  const sampleTx = Transaction.reconstitute({
    id: 'tx-1',
    userId: 'user-1',
    monedaOrigen: Currency.USD,
    monedaDestino: Currency.PEN,
    monto: 100,
    montoCambiado: 373.9,
    tipoCambio: 3.739,
    fecha: new Date('2026-11-27T15:00:00.000Z'),
  });

  beforeEach(() => {
    transactionRepository = {
      save: jest.fn(),
      findHistory: jest.fn(),
    };
    useCase = new GetTransactionHistoryUseCase(transactionRepository);
  });

  it('should force requesterId for non-admin users even if targetUserId is passed', async () => {
    transactionRepository.findHistory.mockResolvedValue({
      items: [sampleTx],
      total: 1,
    });

    const result = await useCase.execute({
      requesterId: 'user-1',
      isAdmin: false,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      targetUserId: 'other-user',
    });

    expect(transactionRepository.findHistory).toHaveBeenCalledWith({
      userId: 'user-1',
      startDate: new Date('2026-11-27T00:00:00.000Z'),
      endDate: new Date('2026-11-27T23:59:59.999Z'),
      page: undefined,
      limit: undefined,
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('should allow admin to query another user history via targetUserId', async () => {
    transactionRepository.findHistory.mockResolvedValue({
      items: [sampleTx],
      total: 1,
    });

    await useCase.execute({
      requesterId: 'admin-1',
      isAdmin: true,
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.999Z',
      targetUserId: 'user-1',
    });

    expect(transactionRepository.findHistory).toHaveBeenCalledWith({
      userId: 'user-1',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      endDate: new Date('2026-11-30T23:59:59.999Z'),
      page: undefined,
      limit: undefined,
    });
  });

  it('should return paginated response when page or limit is specified', async () => {
    transactionRepository.findHistory.mockResolvedValue({
      items: [sampleTx],
      total: 5,
    });

    const result = await useCase.execute({
      requesterId: 'user-1',
      isAdmin: false,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      page: 2,
      limit: 2,
    });

    expect(result).toEqual({
      data: [sampleTx.toResponse()],
      meta: {
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      },
    });
  });

  it('should throw ValidationDomainException when startDate is after endDate', async () => {
    await expect(
      useCase.execute({
        requesterId: 'user-1',
        isAdmin: false,
        startDate: '2026-11-30',
        endDate: '2026-11-01',
      }),
    ).rejects.toThrow(ValidationDomainException);
  });
});
