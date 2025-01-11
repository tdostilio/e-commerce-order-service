import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Create a logger instance for startup logs
  const logger = new Logger('Bootstrap');

  try {
    // Create the NestJS application instance
    const app = await NestFactory.create(AppModule);

    // Set default port with fallback to 3001
    const port = parseInt(process.env.PORT || '3001', 10);

    // Enable validation pipes globally
    // This automatically validates incoming requests against our DTOs
    app.useGlobalPipes(new ValidationPipe());

    // Initialize Swagger documentation
    setupSwagger(app);

    // Configure RabbitMQ connection
    // This makes our application a hybrid that can both:
    // 1. Handle HTTP requests
    // 2. Process RabbitMQ messages
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: process.env.RABBITMQ_ORDER_QUEUE,
        queueOptions: {
          durable: true, // Queue survives broker restart
        },
      },
    });

    // Start both HTTP and microservice servers
    await app.startAllMicroservices();
    await app.listen(port);

    // Log successful startup
    logger.log(`🚀 HTTP Server running on port ${port}`);
    logger.log(
      `📚 Swagger documentation available at http://localhost:${port}/api`,
    );
    logger.log('🐰 RabbitMQ consumer started');
  } catch (error) {
    // Log startup failures and exit
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
