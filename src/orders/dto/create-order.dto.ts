import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * Data Transfer Object for creating new orders
 * Includes validation and Swagger documentation
 */
export class CreateOrderDto {
  @ApiProperty({
    example: 'TEST-001',
    description: 'Unique product identifier',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    example: 5,
    description: 'Number of items to order',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}
