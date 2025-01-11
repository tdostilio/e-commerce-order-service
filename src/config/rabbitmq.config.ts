import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

const logger = new Logger('RabbitMQConfig');

export const rabbitmqConfig: MicroserviceOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: 'inventory_queue',
    queueOptions: {
      durable: true,
    },
    socketOptions: {
      heartbeat: 60,
    },
    noAck: true,
    prefetchCount: 1,
  },
};

logger.debug('RabbitMQ Config initialized with queue: inventory_queue');
