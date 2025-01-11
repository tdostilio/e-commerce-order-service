import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * RabbitMQ configuration for the order service
 * This configuration is used when the service needs to publish messages
 */
export const rabbitmqConfig: MicroserviceOptions = {
  // Specify RabbitMQ as the message broker
  transport: Transport.RMQ,

  options: {
    // Connection URLs - fallback to localhost if not specified
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],

    // Queue name for order-related events
    // This should match the queue that the inventory service listens to
    queue: process.env.RABBITMQ_ORDER_QUEUE,

    // Queue configuration
    queueOptions: {
      // Ensure queue persists after broker restart
      // This prevents message loss during RabbitMQ restarts
      durable: true,
    },
  },
};
