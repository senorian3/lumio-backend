import { RmqContext } from '@nestjs/microservices';

export class RabbitMQUtils {
  static ackMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }

  static rejectMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.reject(originalMessage, false);
  }

  static nackMessage(context: RmqContext): void {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.nack(originalMessage, false, true);
  }
}
