import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Currency } from '../../domain/entities/transaction.entity';

export type TransactionDocument = HydratedDocument<TransactionMongoEntity>;

@Schema({ collection: 'transactions', timestamps: true })
export class TransactionMongoEntity {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'UserMongoEntity',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: Currency })
  monedaOrigen!: Currency;

  @Prop({ required: true, enum: Currency })
  monedaDestino!: Currency;

  @Prop({ required: true })
  monto!: number;

  @Prop({ required: true })
  montoCambiado!: number;

  @Prop({ required: true })
  tipoCambio!: number;

  @Prop({ required: true, default: () => new Date() })
  fecha!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(
  TransactionMongoEntity,
);
TransactionSchema.index({ userId: 1, fecha: -1 });
