import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_INVENTORY_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log('Test consumer is listening');
}
bootstrap();
