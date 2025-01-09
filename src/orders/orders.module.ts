import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Import PrismaModule to make PrismaService available for injection
    PrismaModule,

    // Import ScheduleModule for the @Cron decorator used in timeout handling
    ScheduleModule.forRoot(),

    // Register RabbitMQ client for communicating with the inventory service
    ClientsModule.register([
      {
        // This name matches the @Inject('INVENTORY_SERVICE') in OrdersService
        name: 'INVENTORY_SERVICE',

        // Specify RabbitMQ as the message transport
        transport: Transport.RMQ,

        options: {
          // Connection URL with fallback to localhost
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],

          // Queue name that the inventory service listens to
          queue: 'inventory_queue',

          queueOptions: {
            // Ensure queue persists even after RabbitMQ restarts
            durable: true,
          },
        },
      },
    ]),
  ],
  // Register the controller to handle HTTP requests and RabbitMQ events
  controllers: [OrdersController],

  // Register the service that contains business logic
  providers: [OrdersService],
})
export class OrdersModule {}
