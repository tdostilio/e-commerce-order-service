import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';

// Root module that ties everything together
@Module({
  imports: [
    PrismaModule, // Database connection
    OrdersModule, // Products feature
  ],
})
export class AppModule {}
