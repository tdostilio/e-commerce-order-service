import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

// Root module that ties everything together
@Module({
  imports: [
    PrismaModule, // Database connection
    ProductsModule, // Products feature
  ],
})
export class AppModule {}
