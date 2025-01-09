import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * RabbitMQ configuration for the order service
 * This configuration is used when the service needs to publish messages
 */
export const rabbitmqConfig: MicroserviceOptions = {
  transport: Transport.RMQ,
  options: {
    // Connection URL from environment variables with fallback
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],

    // Queue name for order events
    queue: process.env.RABBITMQ_ORDER_QUEUE,

    // Ensure queue persists after broker restart
    queueOptions: {
      durable: true,
    },
  },
};
