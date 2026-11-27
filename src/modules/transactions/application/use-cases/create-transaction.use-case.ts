import { Inject, Injectable } from '@nestjs/common';
import {
  Currency,
  Transaction,
  TransactionResponse,
} from '../../domain/entities/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';
import {
  EXCHANGE_RATE_READER,
  ExchangeRateReader,
} from '../ports/exchange-rate-reader.port';

export interface CreateTransactionCommand {
  userId: string;
  monedaOrigen: Currency;
  monedaDestino: Currency;
  monto: number;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(EXCHANGE_RATE_READER)
    private readonly exchangeRateReader: ExchangeRateReader,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<TransactionResponse> {
    const currentRate = await this.exchangeRateReader.getLatestRate();

    const transaction = Transaction.createFromExchange({
      userId: command.userId,
      monedaOrigen: command.monedaOrigen,
      monedaDestino: command.monedaDestino,
      monto: command.monto,
      compra: currentRate.compra,
      venta: currentRate.venta,
    });

    const saved = await this.transactionRepository.save(transaction);
    return saved.toResponse();
  }
}
