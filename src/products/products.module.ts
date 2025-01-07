import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

// @Module decorator defines a NestJS module
@Module({
  controllers: [ProductsController], // What handles HTTP requests
  providers: [ProductsService], // Services used in this module
})
export class ProductsModule {}
