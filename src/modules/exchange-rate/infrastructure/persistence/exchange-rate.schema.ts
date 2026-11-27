import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";


export type ExchangeRateDocument = HydratedDocument<ExchangeRateMongoEntity>;

@Schema({ collection: 'exchange_rates', timestamps: true })
export class ExchangeRateMongoEntity {
    @Prop({ required: true })
    compra!: number;

    @Prop({ required: true })
    venta!: number;

    @Prop({ required: true })
    origen!: string;

    @Prop({ required: true })
    moneda!: string;

    @Prop({ required: true })
    fechaProveedor!: string;

    createdAt!: Date;
    updatedAt!: Date;
}

export const ExchangeRateSchema = 
SchemaFactory.createForClass(ExchangeRateMongoEntity);
ExchangeRateSchema.index({ createdAt: -1});