import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateFuelCalculateDto {
  @ApiProperty({ description: 'ID do veículo', example: 77 })
  @IsNotEmpty()
  @IsNumber()
  vehicle: number;

  @ApiProperty({
    description: 'Distância da rota em quilômetros (calculada no frontend via Google Directions)',
    example: 420.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  distanceKm: number;

  @ApiPropertyOptional({ description: 'Preço da gasolina em R$/litro', example: 5.89 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gasolinePrice?: number;

  @ApiPropertyOptional({ description: 'Preço do etanol em R$/litro', example: 3.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ethanolPrice?: number;

  @ApiPropertyOptional({ description: 'Preço do diesel em R$/litro', example: 6.29 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dieselPrice?: number;
}
