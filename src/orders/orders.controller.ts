import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
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

// @Controller('orders') creates routes starting with /orders
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  // OrdersService is automatically injected
  constructor(private readonly ordersService: OrdersService) {}

  // @Get() creates a GET /orders endpoint
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

  // @Get(':id') creates a GET /orders/:id endpoint
  // @Param('id') extracts the id from the URL
  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiResponse({ status: 200, description: 'Return the order.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
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

  // @Post() creates a POST /orders endpoint
  // @Body() extracts the request body and validates it against CreateOrderDto
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'The order has been created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      return await this.ordersService.create(createOrderDto);
    } catch (error) {
      throw error;
    }
  }

  // @Delete(':id') creates a DELETE /orders/:id endpoint
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

  @EventPattern('inventory.reservation_confirmed')
  async handleReservationConfirmed(event: ReservationConfirmedEvent) {
    await this.ordersService.handleReservationConfirmed(event);
  }

  @EventPattern('inventory.reservation_failed')
  async handleReservationFailed(event: ReservationFailedEvent) {
    await this.ordersService.handleReservationFailed(event);
  }
}
