import { Transport, RmqOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('RabbitMQConfig');

export const rabbitmqConfig = (): RmqOptions => {
  const config: RmqOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_INVENTORY_QUEUE || 'inventory_queue',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        reconnectTimeInSeconds: 5,
        heartbeatIntervalInSeconds: 60,
        connectionOptions: {
          timeout: 30000,
          keepAlive: true,
          noDelay: true,
        },
      },
      prefetchCount: 1,
      noAck: false,
      persistent: true,
    },
  };

  logger.debug('RabbitMQ Config initialized');
  return config;
};
