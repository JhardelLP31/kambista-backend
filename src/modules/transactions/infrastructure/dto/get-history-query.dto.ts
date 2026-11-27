import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetHistoryQueryDto {
  @ApiProperty({
    example: '2026-11-01',
    description: 'Inicio del rango (YYYY-MM-DD o ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'startDate es obligatorio y debe tener formato de fecha ISO 8601' },
  )
  startDate!: string;

  @ApiProperty({
    example: '2026-11-30',
    description: 'Fin del rango (YYYY-MM-DD o ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'endDate es obligatorio y debe tener formato de fecha ISO 8601' },
  )
  endDate!: string;

  @ApiPropertyOptional({
    example: '6746b1a2f1d2e3a4b5c6d7e8',
    description:
      'Solo disponible para rol admin. El rol user siempre consulta su propio historial.',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit?: number;
}
