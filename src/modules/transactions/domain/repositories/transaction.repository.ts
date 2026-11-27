import { Transaction } from '../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface FindTransactionHistoryFilter {
  userId: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findHistory(filter: FindTransactionHistoryFilter): Promise<PaginatedTransactions>;
}
