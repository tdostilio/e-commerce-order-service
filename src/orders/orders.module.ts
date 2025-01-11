import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Import Prisma module for database access
    PrismaModule,
    // Import Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Configure RabbitMQ client
    ClientsModule.register([
      {
        // Token used for dependency injection
        name: 'INVENTORY_SERVICE',
        // Use RabbitMQ as transport
        transport: Transport.RMQ,
        options: {
          // RabbitMQ connection URL
          urls: [process.env.RABBITMQ_URL],
          // Queue name for inventory service communication
          queue: process.env.RABBITMQ_INVENTORY_QUEUE,
          queueOptions: {
            // Ensure queue survives broker restarts
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
