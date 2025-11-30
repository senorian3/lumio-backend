import { registerAs } from '@nestjs/config';

export const messagingConfig = registerAs('messaging', () => ({
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    queues: {
      userEvents: 'user.events',
      fileEvents: 'file.events',
    },
    exchanges: {
      user: 'user.exchange',
      file: 'file.exchange',
    },
  },
}));
