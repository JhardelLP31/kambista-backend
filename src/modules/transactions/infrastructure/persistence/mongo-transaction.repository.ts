import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';
import { Transaction } from '../../domain/entities/transaction.entity';
import {
  FindTransactionHistoryFilter,
  PaginatedTransactions,
  TransactionRepository,
} from '../../domain/repositories/transaction.repository';
import {
  TransactionDocument,
  TransactionMongoEntity,
} from './transaction.schema';

@Injectable()
export class MongoTransactionRepository implements TransactionRepository {
  constructor(
    @InjectModel(TransactionMongoEntity.name)
    private readonly model: Model<TransactionDocument>,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    if (!Types.ObjectId.isValid(transaction.userId)) {
      throw new ValidationDomainException('El identificador de usuario no es válido');
    }

    const created = await this.model.create({
      userId: new Types.ObjectId(transaction.userId),
      monedaOrigen: transaction.monedaOrigen,
      monedaDestino: transaction.monedaDestino,
      monto: transaction.monto,
      montoCambiado: transaction.montoCambiado,
      tipoCambio: transaction.tipoCambio,
      fecha: transaction.fecha,
    });

    return this.toDomain(created);
  }

  async findHistory(
    filter: FindTransactionHistoryFilter,
  ): Promise<PaginatedTransactions> {
    if (!Types.ObjectId.isValid(filter.userId)) {
      throw new ValidationDomainException('El userId proporcionado no es válido');
    }

    const mongoFilter = {
      userId: new Types.ObjectId(filter.userId),
      fecha: {
        $gte: filter.startDate,
        $lte: filter.endDate,
      },
    };

    if (filter.page !== undefined && filter.limit !== undefined) {
      const skip = (filter.page - 1) * filter.limit;
      const [docs, total] = await Promise.all([
        this.model
          .find(mongoFilter)
          .sort({ fecha: -1 })
          .skip(skip)
          .limit(filter.limit)
          .exec(),
        this.model.countDocuments(mongoFilter).exec(),
      ]);

      return {
        items: docs.map((doc) => this.toDomain(doc)),
        total,
      };
    }

    const docs = await this.model.find(mongoFilter).sort({ fecha: -1 }).exec();
    return {
      items: docs.map((doc) => this.toDomain(doc)),
      total: docs.length,
    };
  }

  private toDomain(doc: TransactionDocument): Transaction {
    return Transaction.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      monedaOrigen: doc.monedaOrigen,
      monedaDestino: doc.monedaDestino,
      monto: doc.monto,
      montoCambiado: doc.montoCambiado,
      tipoCambio: doc.tipoCambio,
      fecha: doc.fecha,
    });
  }
}
