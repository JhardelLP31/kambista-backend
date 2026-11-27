import { ValidationDomainException } from "../../../../shared/domain/exceptions/domain.exception";


export interface ExchangeRateProps {
    id?: string;
    compra: number;
    venta: number;
    origen: string;
    moneda: string;
    fechaProveedor: string;
    createdAt: Date;
}

export class ExchangeRate {
    public readonly id?: string;
    public readonly compra: number;
    public readonly venta: number;
    public readonly origen: string;
    public readonly moneda: string;
    public readonly fechaProveedor: string;
    public readonly createdAt: Date;

    private constructor(props: ExchangeRateProps) {
        this.id = props.id;
        this.compra = props.compra;
        this.venta = props.venta;
        this.origen = props.origen;
        this.moneda = props.moneda;
        this.fechaProveedor = props.fechaProveedor;
        this.createdAt = props.createdAt;
    }

    public static create(props: Omit<ExchangeRateProps, 'createdAt'> & { createdAt?: Date }): ExchangeRate {
        if (!Number.isFinite(props.compra) || props.compra <= 0) {
            throw new ValidationDomainException('El tipo de cambio de compra debe ser mayor a cero');
        }
        if (!Number.isFinite(props.venta) || props.venta <= 0) {
            throw new ValidationDomainException('El tipo de cambio de venta debe ser mayor a cero');
        }
        if (!props.origen?.trim() || !props.moneda?.trim()) {
            throw new ValidationDomainException('El origen y la moneda del tipo de cambio son obligatorios');
        }
        return new ExchangeRate({
            ...props,
            createdAt: props.createdAt ?? new Date(),
        });

    }
}