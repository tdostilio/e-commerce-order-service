import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// @Module decorator defines a NestJS module
@Module({
  controllers: [OrdersController], // What handles HTTP requests
  providers: [OrdersService], // Services used in this module
})
export class OrdersModule {}
