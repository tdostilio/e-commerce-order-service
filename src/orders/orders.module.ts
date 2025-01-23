import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersHttpController } from './controllers/orders.http.controller';
import { OrdersMessageController } from './controllers/orders.message.controller';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_INVENTORY_QUEUE || 'inventory_queue',
          queueOptions: {
            durable: true,
          },
          persistent: true,
        },
      },
    ]),
  ],
  controllers: [OrdersHttpController, OrdersMessageController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
