import { Inject, Injectable } from '@nestjs/common';
import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { TransactionResponse } from '../../domain/entities/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';

export interface GetTransactionHistoryQuery {
  requesterId: string;
  isAdmin: boolean;
  startDate: string;
  endDate: string;
  targetUserId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedHistoryResponse {
  data: TransactionResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class GetTransactionHistoryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(
    query: GetTransactionHistoryQuery,
  ): Promise<TransactionResponse[] | PaginatedHistoryResponse> {
    const startDate = this.parseBoundaryDate(query.startDate, 'start');
    const endDate = this.parseBoundaryDate(query.endDate, 'end');

    if (startDate.getTime() > endDate.getTime()) {
      throw new ValidationDomainException(
        'La fecha de inicio (startDate) no puede ser mayor a la fecha de fin (endDate)',
      );
    }

    const effectiveUserId =
      query.isAdmin && query.targetUserId?.trim()
        ? query.targetUserId.trim()
        : query.requesterId;

    const shouldPaginate =
      query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const { items, total } = await this.transactionRepository.findHistory({
      userId: effectiveUserId,
      startDate,
      endDate,
      page: shouldPaginate ? page : undefined,
      limit: shouldPaginate ? limit : undefined,
    });

    const mapped = items.map((transaction) => transaction.toResponse());

    if (!shouldPaginate) {
      return mapped;
    }

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private parseBoundaryDate(raw: string, boundary: 'start' | 'end'): Date {
    const trimmed = raw.trim();
    const normalized = DATE_ONLY_REGEX.test(trimmed)
      ? boundary === 'start'
        ? `${trimmed}T00:00:00.000Z`
        : `${trimmed}T23:59:59.999Z`
      : trimmed;

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationDomainException(
        `La fecha '${raw}' no tiene un formato válido`,
      );
    }
    return parsed;
  }
}
