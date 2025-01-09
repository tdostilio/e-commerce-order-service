import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export const rabbitmqConfig: MicroserviceOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: 'order_queue',
    queueOptions: {
      durable: true,
    },
  },
};
