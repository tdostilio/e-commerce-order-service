import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { rabbitmqConfig } from '../config/rabbitmq.config';

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
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
