import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes this module available everywhere without importing
@Module({
  providers: [PrismaService], // Services that this module creates
  exports: [PrismaService], // Makes PrismaService available to other modules
})
export class PrismaModule {}
