import {
  Injectable,
  OnModuleInit,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
import {
  OrderNotFoundError,
  InvalidParameterError,
} from './errors/order.errors';
import { lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

// @Injectable() marks this as a service that can be dependency injected
@Injectable()
export class OrdersService implements OnModuleInit {
  // Time in minutes before an order times out if not confirmed
  private readonly TIMEOUT_MINUTES = 5;
  // Logger instance for this service
  private readonly logger = new Logger(OrdersService.name);
  private readonly reconnectInterval = 5000; // 5 seconds
  private isCircuitOpen = false;
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly productServiceUrl: string;

  constructor(
    // Inject the database service
    private prisma: PrismaService,
    // Inject the RabbitMQ client for communicating with product service
    @Inject('PRODUCT_SERVICE') private productClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {
    // Default to host.docker.internal for local development
    this.productServiceUrl =
      process.env.PRODUCT_SERVICE_URL || 'http://host.docker.internal:3000';

    // Log RabbitMQ configuration on service instantiation
    const redactedUrl = process.env.RABBITMQ_URL?.replace(
      /:\/\/(.*?)@/,
      '://****:****@',
    );
  }

  // Connect to RabbitMQ when the module initializes
  async onModuleInit() {
    this.logger.log('Initializing OrdersService...');
    try {
      this.logger.log('Attempting to connect to RabbitMQ...');
      await this.connectWithRetry();
      this.logger.log('OrdersService initialization complete');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ connection:', error);
      // In a production environment, you might want to throw this error
      // to prevent the service from starting with a broken message broker connection
      throw error;
    }
  }

  private async connectWithRetry() {
    if (this.connectionPromise) {
      this.logger.debug('Connection attempt already in progress...');
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>(async (resolve) => {
      while (!this.isConnected) {
        try {
          this.logger.debug('Attempting to establish RabbitMQ connection...');

          // Add more detailed error handling for the connection
          const client = (this.productClient as any).client;
          if (client) {
            const redactedUrls = client.options?.urls?.map((url) =>
              url.replace(/:\/\/(.*?)@/, '://****:****@'),
            );
            this.logger.debug('RabbitMQ client configuration:', {
              urls: redactedUrls,
              hostname: client.options?.hostname,
              port: client.options?.port,
              vhost: client.options?.vhost,
              queue: client.options?.queue,
            });
          }

          await this.productClient.connect();
          this.isConnected = true;
          this.logger.log('Successfully connected to RabbitMQ');

          // Set up connection error listener with more detailed logging
          (this.productClient as any).client.on('error', (err: any) => {
            this.logger.error('RabbitMQ connection error:', {
              message: err.message,
              code: err.code,
              stack: err.stack,
            });
            this.handleDisconnect();
          });

          (this.productClient as any).client.on('close', (err?: any) => {
            this.logger.warn(
              'RabbitMQ connection closed',
              err
                ? {
                    message: err.message,
                    code: err.code,
                  }
                : undefined,
            );
            this.handleDisconnect();
          });

          resolve();
          break;
        } catch (error) {
          this.isConnected = false;
          this.logger.error(
            'Failed to connect to RabbitMQ. Retrying in 5 seconds...',
            {
              message: error.message,
              code: error.code,
              stack: error.stack,
            },
          );
          await new Promise((r) => setTimeout(r, this.reconnectInterval));
        }
      }
    });

    return this.connectionPromise;
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.connectionPromise = null;
    setTimeout(() => {
      this.connectWithRetry().catch((err) => {
        this.logger.error('Failed to reconnect:', err);
      });
    }, this.reconnectInterval);
  }

  // Validate that SKU exists in product catalog
  private async validateInventory(
    sku: string,
    quantity: number,
  ): Promise<void> {
    this.logger.debug('Starting product validation...', { sku, quantity });

    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${this.productServiceUrl}/products/${sku}`),
      );

      if (!data) {
        throw new NotFoundException(`Product with SKU ${sku} not found`);
      }

      if (!data.stock || data.stock < quantity) {
        throw new BadRequestException(`Insufficient stock for SKU ${sku}`);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException(
          'Products service is unavailable',
        );
      }

      this.logger.error('Failed to validate product:', error);
      throw new ServiceUnavailableException('Products service unavailable');
    }
  }

  // Create a new order and notify inventory service
  async create(data: CreateOrderDto) {
    try {
      // First validate sku and inventory exists
      await this.validateInventory(data.sku, data.quantity);

      // Use transaction to ensure both order and outbox message are created
      return await this.prisma.$transaction(async (tx) => {
        const timeout = new Date();
        timeout.setMinutes(timeout.getMinutes() + this.TIMEOUT_MINUTES);

        // Create order in database
        const order = await tx.order.create({
          data: {
            ...data,
            status: OrderStatus.PENDING,
            timeout,
          },
        });

        // Notify inventory service about new order using Circuit Breaker
        this.logger.log(`Publishing order created event for order ${order.id}`);
        try {
          await this.publishWithCircuitBreaker('order.created', {
            orderId: order.id,
            sku: order.sku,
            quantity: order.quantity,
          });
          this.logger.log(`Successfully published order created event`);
        } catch (error) {
          // If publishing fails, create outbox message
          await tx.outboxMessage.create({
            data: {
              type: 'order.created',
              payload: {
                orderId: order.id,
                sku: order.sku,
                quantity: order.quantity,
              },
              status: 'pending',
              orderId: order.id,
            },
          });
          this.logger.warn(
            `Failed to publish event, created outbox message for order ${order.id}`,
          );
        }

        return order;
      });
    } catch (error) {
      this.logger.error('Failed to create order:', error);
      throw error;
    }
  }

  // Simplify publishWithCircuitBreaker to only handle event emissions
  private async publishWithCircuitBreaker(event: string, data: any) {
    if (!this.isConnected) {
      throw new Error('Message broker is not connected');
    }

    if (this.isCircuitOpen) {
      throw new Error('Circuit is open, message broker is unavailable');
    }

    try {
      await lastValueFrom(
        this.productClient.emit(event, data).pipe(
          timeout(5000), // Add timeout of 5 seconds
        ),
      );
      this.failureCount = 0;
    } catch (error) {
      this.failureCount++;
      this.logger.error(`Failed to publish event ${event}:`, error);

      if (this.failureCount >= this.failureThreshold) {
        this.isCircuitOpen = true;
        setTimeout(() => {
          this.isCircuitOpen = false;
          this.failureCount = 0;
        }, this.resetTimeout);
      }

      throw error;
    }
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

    this.productClient.emit('order.cancelled', {
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

  // Process outbox messages periodically
  @Cron('*/10 * * * * *') // Run every 10 seconds
  async processOutboxMessages() {
    try {
      const messages = await this.prisma.outboxMessage.findMany({
        where: {
          status: 'pending',
          attempts: { lt: 3 }, // Less than 3 attempts
        },
        take: 10, // Process in batches
      });

      for (const message of messages) {
        try {
          await this.publishWithCircuitBreaker(message.type, message.payload);

          await this.prisma.outboxMessage.update({
            where: { id: message.id },
            data: { status: 'processed' },
          });
        } catch (error) {
          await this.prisma.outboxMessage.update({
            where: { id: message.id },
            data: {
              attempts: { increment: 1 },
              error: error.message,
              status: message.attempts >= 2 ? 'failed' : 'pending',
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to process outbox messages:', error);
    }
  }
}
