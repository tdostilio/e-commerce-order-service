import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const port = parseInt(process.env.PORT || '3001', 10); // Explicitly use 3001 as default

    // Global configurations
    app.useGlobalPipes(new ValidationPipe());

    // Setup Swagger
    setupSwagger(app);

    // Connect to RabbitMQ as a hybrid application
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: process.env.RABBITMQ_ORDER_QUEUE,
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.startAllMicroservices();
    await app.listen(port);

    logger.log(`🚀 HTTP Server running on port ${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );
    logger.log('🐰 RabbitMQ consumer started');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
