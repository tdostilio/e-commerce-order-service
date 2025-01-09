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

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly TIMEOUT_MINUTES = 5;
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.inventoryClient.connect();
  }

  async create(data: CreateOrderDto) {
    try {
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + this.TIMEOUT_MINUTES);

      const order = await this.prisma.order.create({
        data: {
          ...data,
          status: OrderStatus.PENDING,
          expiration,
        },
      });

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
        expiration: null,
      },
    });
  }

  async handleReservationFailed(event: ReservationFailedEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: {
        status: OrderStatus.FAILED,
        expiration: null,
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
        expiration: {
          lt: new Date(),
        },
      },
    });

    for (const order of timedOutOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FAILED,
          expiration: null,
        },
      });
    }
  }

  async handleReservationConfirmed(event: ReservationConfirmedEvent) {
    await this.prisma.order.update({
      where: { id: event.orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        expiration: null,
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
