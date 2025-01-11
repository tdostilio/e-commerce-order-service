import { Transport, RmqOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('RabbitMQConfig');

export const rabbitmqConfig = (): RmqOptions => {
  const config: RmqOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'inventory_queue',
      socketOptions: {
        heartbeat: 60,
      },
    },
  };

  logger.debug('RabbitMQ Config initialized');
  return config;
};
