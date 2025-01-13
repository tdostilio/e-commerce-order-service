import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { rabbitmqConfig } from '../config/rabbitmq.config';
import { OrdersHttpController } from './controllers/orders.http.controller';
import { OrdersMessageController } from './controllers/orders.message.controller';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        ...rabbitmqConfig(),
      },
    ]),
  ],
  controllers: [OrdersHttpController, OrdersMessageController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
