import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientProxy } from '@nestjs/microservices';
import { OrderStatus } from './enums/order-status.enum';
import {
  ReservationConfirmedEvent,
  ReservationFailedEvent,
  ReservationCancelledEvent,
} from './events/order.events';
import { Cron } from '@nestjs/schedule';
import { OrderNotFoundError } from './errors/order.errors';
import { lastValueFrom } from 'rxjs';

// @Injectable() marks this as a service that can be dependency injected
@Injectable()
export class OrdersService implements OnModuleInit {
  // Time in minutes before an order times out if not confirmed
  private readonly TIMEOUT_MINUTES = 5;
  // Logger instance for this service
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    // Inject the database service
    private prisma: PrismaService,
    // Inject the RabbitMQ client for communicating with inventory service
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
  ) {}

  // Connect to RabbitMQ when the module initializes
  async onModuleInit() {
    await this.inventoryClient.connect();
  }

  // Create a new order and notify inventory service
  async create(data: CreateOrderDto) {
    try {
      // Calculate timeout timestamp
      const timeout = new Date();
      timeout.setMinutes(timeout.getMinutes() + this.TIMEOUT_MINUTES);

      // Create order in database
      const order = await this.prisma.order.create({
        data: {
          ...data,
          status: OrderStatus.PENDING,
          timeout,
        },
      });

      // Notify inventory service about new order
      this.logger.log(`Publishing order created event for order ${order.id}`);
      await lastValueFrom(
        this.inventoryClient.emit('order.created', {
          orderId: order.id,
          sku: order.sku,
          quantity: order.quantity,
        }),
      );
      this.logger.log(`Successfully published order created event`);

      return order;
    } catch (error) {
      this.logger.error(
        `Failed to create order: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleInventoryReserved(event: ReservationConfirmedEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        timeout: null,
      },
    });
  }

  async handleReservationFailed(event: ReservationFailedEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: {
        status: OrderStatus.FAILED,
        timeout: null,
      },
    });
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLING },
    });

    this.inventoryClient.emit('order.cancelled', {
      orderId: order.id,
    });

    return order;
  }

  async handleReservationCancelled(event: ReservationCancelledEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  @Cron('* * * * *') // Run every minute
  async handleTimeouts() {
    const timedOutOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        timeout: {
          lt: new Date(),
        },
      },
    });

    for (const order of timedOutOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FAILED,
          timeout: null,
        },
      });
    }
  }

  async handleReservationConfirmed(event: ReservationConfirmedEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        timeout: null,
      },
    });
  }

  async findAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  async update(id: string, updateData: Partial<CreateOrderDto>) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CONFIRMED) {
      throw new OrderNotFoundError(id);
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CONFIRMED) {
      throw new OrderNotFoundError(id);
    }

    return this.prisma.order.delete({
      where: { id },
    });
  }
}
