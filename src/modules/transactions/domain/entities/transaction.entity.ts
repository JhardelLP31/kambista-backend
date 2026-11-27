import { ValidationDomainException } from '../../../../shared/domain/exceptions/domain.exception';

export enum Currency {
  USD = 'USD',
  PEN = 'PEN',
}

export interface TransactionProps {
  id?: string;
  userId: string;
  monedaOrigen: Currency;
  monedaDestino: Currency;
  monto: number;
  montoCambiado: number;
  tipoCambio: number;
  fecha: Date;
}

export interface CreateExchangeTransactionProps {
  userId: string;
  monedaOrigen: Currency;
  monedaDestino: Currency;
  monto: number;
  compra: number;
  venta: number;
  fecha?: Date;
}

export interface TransactionResponse {
  id: string;
  monedaOrigen: Currency;
  monedaDestino: Currency;
  monto: number;
  montoCambiado: number;
  tipoCambio: number;
  fecha: string;
}

const MAX_MONTO = 9_999_999.99;

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function hasMoreThanTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) > 1e-8;
}

export class Transaction {
  public readonly id?: string;
  public readonly userId: string;
  public readonly monedaOrigen: Currency;
  public readonly monedaDestino: Currency;
  public readonly monto: number;
  public readonly montoCambiado: number;
  public readonly tipoCambio: number;
  public readonly fecha: Date;

  private constructor(props: TransactionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.monedaOrigen = props.monedaOrigen;
    this.monedaDestino = props.monedaDestino;
    this.monto = props.monto;
    this.montoCambiado = props.montoCambiado;
    this.tipoCambio = props.tipoCambio;
    this.fecha = props.fecha;
  }

  public static createFromExchange(
    props: CreateExchangeTransactionProps,
  ): Transaction {
    if (!props.userId?.trim()) {
      throw new ValidationDomainException('El usuario de la transacción es obligatorio');
    }

    if (!Object.values(Currency).includes(props.monedaOrigen)) {
      throw new ValidationDomainException('La moneda de origen no es válida');
    }

    if (!Object.values(Currency).includes(props.monedaDestino)) {
      throw new ValidationDomainException('La moneda de destino no es válida');
    }

    if (props.monedaOrigen === props.monedaDestino) {
      throw new ValidationDomainException(
        'Las monedas de origen y destino no pueden ser iguales',
      );
    }

    if (!Number.isFinite(props.monto) || props.monto <= 0) {
      throw new ValidationDomainException('El monto debe ser mayor a cero');
    }

    if (props.monto > MAX_MONTO) {
      throw new ValidationDomainException(
        'El monto no puede superar 7 dígitos enteros (9,999,999.99)',
      );
    }

    if (hasMoreThanTwoDecimals(props.monto)) {
      throw new ValidationDomainException(
        'El monto admite como máximo 2 decimales',
      );
    }

    if (!Number.isFinite(props.compra) || props.compra <= 0) {
      throw new ValidationDomainException('El tipo de cambio de compra no es válido');
    }

    if (!Number.isFinite(props.venta) || props.venta <= 0) {
      throw new ValidationDomainException('El tipo de cambio de venta no es válido');
    }

    const isUsdToPen =
      props.monedaOrigen === Currency.USD &&
      props.monedaDestino === Currency.PEN;

    const tipoCambio = isUsdToPen ? props.venta : props.compra;
    const rawConverted = isUsdToPen
      ? props.monto * props.venta
      : props.monto / props.compra;

    return new Transaction({
      userId: props.userId,
      monedaOrigen: props.monedaOrigen,
      monedaDestino: props.monedaDestino,
      monto: roundToTwoDecimals(props.monto),
      montoCambiado: roundToTwoDecimals(rawConverted),
      tipoCambio,
      fecha: props.fecha ?? new Date(),
    });
  }

  public static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  public toResponse(): TransactionResponse {
    return {
      id: this.id ?? '',
      monedaOrigen: this.monedaOrigen,
      monedaDestino: this.monedaDestino,
      monto: this.monto,
      montoCambiado: this.montoCambiado,
      tipoCambio: this.tipoCambio,
      fecha: this.fecha.toISOString(),
    };
  }
}
