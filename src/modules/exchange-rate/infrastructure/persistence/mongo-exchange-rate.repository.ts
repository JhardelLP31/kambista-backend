import { Injectable } from "@nestjs/common";
import { ExchangeRateRepository } from "../../domain/repositories/exchange-rate.repository";
import { InjectModel } from "@nestjs/mongoose";
import { ExchangeRateDocument, ExchangeRateMongoEntity } from "./exchange-rate.schema";
import { Model } from "mongoose";
import { ExchangeRate } from "../../domain/entities/exchange-rate.entity";




@Injectable()
export class MongoExchangeRateRepository implements ExchangeRateRepository {
    constructor(
        @InjectModel(ExchangeRateMongoEntity.name)
        private readonly model: Model<ExchangeRateDocument>,
    ) {}

    async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
        const created = await this.model.create({
            compra: exchangeRate.compra,
            venta: exchangeRate.venta,
            fechaProveedor: exchangeRate.fechaProveedor,
            origen: exchangeRate.origen,
            moneda: exchangeRate.moneda,
        });

        return this.toDomain(created);
    }

    async findLatest(): Promise<ExchangeRate | null> {
        const doc = await this.model.findOne().sort({ createdAt: -1 }).exec();
        return doc ? this.toDomain(doc): null;
    }

    private toDomain(doc: ExchangeRateDocument): ExchangeRate {
        return ExchangeRate.create({
            id: doc._id.toString(),
            compra: doc.compra,
            venta: doc.venta,
            origen: doc.origen,
            moneda: doc.moneda,
            fechaProveedor: doc.fechaProveedor,
            createdAt: doc.createdAt,
        });
    }
}