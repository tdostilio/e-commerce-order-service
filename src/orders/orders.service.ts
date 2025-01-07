import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderNotFoundError,
  InvalidParameterError,
} from './errors/order.errors';

// @Injectable() marks this as a service that can be injected into other classes
@Injectable()
export class OrdersService {
  // Prisma is automatically injected by NestJS's dependency injection
  constructor(private prisma: PrismaService) {}

  // Get all orders, optionally by status, from the database
  async findAll(status?: string) {
    if (!status) {
      return this.prisma.order.findMany();
    }
    return this.prisma.order.findMany({ where: { status } });
  }

  // Get a single order by ID
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    return order;
  }

  // Create a new Order
  async create(data: CreateOrderDto) {
    try {
      // TODO: Add logic to check if the order is valid and product is in stock
      // TODO: Publish an event to the message queue
      if (data.quantity <= 0) {
        throw new InvalidParameterError('Quantity must be greater than 0');
      }
      return await this.prisma.order.create({
        data: {
          ...data,
          status: 'pending',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Update an existing order
  // Partial<CreateorderDto> means all fields are optional
  async update(id: string, data: Partial<CreateOrderDto>) {
    try {
      // error if trying to update an order already completed
      return await this.prisma.order.update({
        where: { id, status: 'pending' },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new OrderNotFoundError(id);
      }
      throw error;
    }
  }

  // Delete an order
  async remove(id: string) {
    try {
      return await this.prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new OrderNotFoundError(id);
      }
      throw error;
    }
  }
}
