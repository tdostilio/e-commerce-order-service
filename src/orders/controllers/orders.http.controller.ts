import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Query,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from '../orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderNotFoundError } from '../errors/order.errors';

@ApiTags('orders')
@Controller('orders')
export class OrdersHttpController {
  private readonly logger = new Logger(OrdersHttpController.name);
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
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters or insufficient inventory.',
  })
  @ApiResponse({
    status: 503,
    description: 'Product service is unavailable.',
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      const order = await this.ordersService.create(createOrderDto);
      return {
        success: true,
        message: 'Order created successfully',
        data: order,
      };
    } catch (error) {
      if (error.name === 'InvalidParameterError') {
        throw new BadRequestException(error.message);
      }
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      // Log unexpected errors but don't expose details to client
      this.logger.error('Failed to create order:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the order',
      );
    }
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
