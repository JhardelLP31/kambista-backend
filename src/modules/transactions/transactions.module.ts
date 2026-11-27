import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { EXCHANGE_RATE_READER } from './application/ports/exchange-rate-reader.port';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionHistoryUseCase } from './application/use-cases/get-transaction-history.use-case';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository';
import { ExchangeRateModuleAdapter } from './infrastructure/adapters/exchange-rate-module.adapter';
import { TransactionsController } from './infrastructure/controllers/transactions.controller';
import { MongoTransactionRepository } from './infrastructure/persistence/mongo-transaction.repository';
import {
  TransactionMongoEntity,
  TransactionSchema,
} from './infrastructure/persistence/transaction.schema';

@Module({
  imports: [
    AuthModule,
    ExchangeRateModule,
    MongooseModule.forFeature([
      { name: TransactionMongoEntity.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [
    CreateTransactionUseCase,
    GetTransactionHistoryUseCase,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: MongoTransactionRepository,
    },
    {
      provide: EXCHANGE_RATE_READER,
      useClass: ExchangeRateModuleAdapter,
    },
  ],
})
export class TransactionsModule {}
