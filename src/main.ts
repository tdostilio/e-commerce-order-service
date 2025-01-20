import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds

  try {
    // 1. Initialize HTTP app
    logger.log('Initializing HTTP server...');
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());

    // 2. Set up Swagger
    logger.log('Setting up Swagger documentation...');
    setupSwagger(app);

    // 3. Connect to RabbitMQ with retries
    logger.log('Connecting to RabbitMQ...');
    let retries = 0;
    let connected = false;

    while (!connected && retries < MAX_RETRIES) {
      try {
        app.connectMicroservice<MicroserviceOptions>({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL],
            queue: process.env.RABBITMQ_INVENTORY_QUEUE,
            queueOptions: {
              durable: true,
            },
          },
        });

        await app.startAllMicroservices();
        connected = true;
        logger.log('🐰 RabbitMQ consumer started successfully');
      } catch (rmqError) {
        retries++;
        logger.error(
          `Failed to connect to RabbitMQ (attempt ${retries}/${MAX_RETRIES}):`,
          rmqError,
        );

        if (retries === MAX_RETRIES) {
          logger.error(
            'Maximum RabbitMQ connection retries reached. Shutting down.',
          );
          process.exit(1);
        }

        logger.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // 4. Only start HTTP server if RabbitMQ is connected
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen(port);
    logger.log(`🚀 HTTP Server running on port ${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
