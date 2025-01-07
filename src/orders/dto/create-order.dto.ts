import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'TEST-001', // Example value
    description: 'Product SKU', // Description of the property
  })
  @IsString() // Validation decorator
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 5, description: 'Order quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;
}
