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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderNotFoundError } from './errors/order.errors';
import { EventPattern } from '@nestjs/microservices';
import {
  ReservationFailedEvent,
  ReservationConfirmedEvent,
} from './events/order.events';

/**
 * Controller handling all order-related HTTP endpoints and message patterns
 * @ApiTags('orders') groups these endpoints in Swagger documentation
 */
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * GET /orders - Retrieve all orders, optionally filtered by status
   * @param status Optional status filter
   * @returns Array of orders
   */
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

  /**
   * GET /orders/:id - Retrieve a single order by ID
   * @param id Order ID
   * @throws NotFoundException if order doesn't exist
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.ordersService.findOne(id);
    } catch (error) {
      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * POST /orders - Create a new order
   * @param createOrderDto Order creation data
   */
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(createOrderDto);
  }

  /**
   * DELETE /orders/:id - Cancel an order
   * @param id Order ID
   * @throws NotFoundException if order doesn't exist
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({
    status: 200,
    description: 'The order has been cancelled successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
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

  /**
   * Message pattern handlers for RabbitMQ events
   */
  @EventPattern('inventory.reservation_confirmed')
  async handleReservationConfirmed(event: ReservationConfirmedEvent) {
    await this.ordersService.handleReservationConfirmed(event);
  }

  @EventPattern('inventory.reservation_failed')
  async handleReservationFailed(event: ReservationFailedEvent) {
    await this.ordersService.handleReservationFailed(event);
  }
}
