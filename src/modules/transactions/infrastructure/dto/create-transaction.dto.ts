import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, Max } from 'class-validator';
import { Currency } from '../../domain/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency, { message: 'monedaOrigen debe ser USD o PEN' })
  monedaOrigen!: Currency;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @IsEnum(Currency, { message: 'monedaDestino debe ser USD o PEN' })
  monedaDestino!: Currency;

  @ApiProperty({
    example: 100,
    minimum: 0.01,
    maximum: 9999999.99,
    description: 'Monto a cambiar (máximo 7 dígitos enteros y 2 decimales)',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser numérico con máximo 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  @Max(9_999_999.99, {
    message: 'El monto no puede superar 7 dígitos enteros (9,999,999.99)',
  })
  monto!: number;
}
