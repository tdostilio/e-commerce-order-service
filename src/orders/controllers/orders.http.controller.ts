import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from '../orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderNotFoundError } from '../errors/order.errors';

@ApiTags('orders')
@Controller('orders')
export class OrdersHttpController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter orders by status',
  })
  async findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(createOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({
    status: 200,
    description: 'The order has been cancelled successfully.',
  })
  async remove(@Param('id') id: string) {
    try {
      return await this.ordersService.cancelOrder(id);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw error;
    }
  }
}
