import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable() // Tells NestJS this class can be injected into other classes
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Extends PrismaClient so we get all the database methods
  // Implements OnModuleInit so we can connect when the module starts

  async onModuleInit() {
    // This runs when the module initializes
    await this.$connect(); // Connects to the database
  }
}
