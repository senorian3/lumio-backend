import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentsAcknowledgmentService } from '../application/payments-acknowledgment.service';

export interface PaymentCompletedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    profileId: number;
    amount: number;
    currency: string;
    subscriptionId: string;
    subscriptionType: string;
    periodStart: Date;
    periodEnd: Date;
    nextPaymentDate: Date;
    timestamp: string;
  };
  timestamp: Date;
}

export interface PaymentFailedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    error: string;
    timestamp: string;
  };
  timestamp: Date;
}

export interface SubscriptionCancelledEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    subscriptionId: string;
    timestamp: string;
  };
  timestamp: Date;
}

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  private readonly logger = new Logger(PaymentsRabbitMQController.name);

  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly acknowledgmentService: PaymentsAcknowledgmentService,
  ) {}

  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload() data: PaymentCompletedEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Process the payment completion
      await this.processPaymentCompleted(data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendPaymentCompletedAcknowledgment(
        data.id,
        data.payload.paymentId,
      );

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
      channel.ack(originalMessage);

      this.appLogger.log(
        `Successfully processed payment completed event: ${data.payload.paymentId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing payment completed event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload() data: PaymentFailedEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Process the payment failure
      await this.processPaymentFailed(data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendPaymentFailedAcknowledgment(
        data.id,
        data.payload.paymentId,
        data.payload.error,
      );

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
      channel.ack(originalMessage);
    } catch (error) {
      this.appLogger.error(
        `Error processing payment failed event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  @EventPattern('subscription.cancelled')
  async handleSubscriptionCancelled(
    @Payload() data: SubscriptionCancelledEvent,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Process the subscription cancellation
      await this.processSubscriptionCancelled(data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendSubscriptionCancelledAcknowledgment(
        data.id,
        data.payload.paymentId,
      );

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
      channel.ack(originalMessage);

      this.appLogger.log(
        `Successfully processed subscription cancelled event: ${data.payload.paymentId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription cancelled event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  private async processPaymentCompleted(
    data: PaymentCompletedEvent,
  ): Promise<void> {
    // TODO: Implement actual payment processing logic
    // This would typically involve:
    // 1. Updating the user's subscription status in the database
    // 2. Creating/updating the subscription entity
    // 3. Sending acknowledgment back to Payments service

    this.logger.log(
      `Processing payment completed for payment ${data.payload.paymentId}`,
    );

    // For now, just log the data
    this.logger.log(`Payment data: ${JSON.stringify(data.payload)}`);
  }

  private async processPaymentFailed(data: PaymentFailedEvent): Promise<void> {
    // TODO: Implement actual payment failure processing logic
    // This would typically involve:
    // 1. Updating the user's subscription status
    // 2. Notifying the user about the failure
    // 3. Sending acknowledgment back to Payments service

    this.logger.log(
      `Processing payment failed for payment ${data.payload.paymentId}`,
    );

    // For now, just log the data
    this.logger.log(`Payment failure data: ${JSON.stringify(data.payload)}`);
  }

  private async processSubscriptionCancelled(
    data: SubscriptionCancelledEvent,
  ): Promise<void> {
    // TODO: Implement actual subscription cancellation processing logic
    // This would typically involve:
    // 1. Updating the user's subscription status
    // 2. Marking the subscription as cancelled
    // 3. Sending acknowledgment back to Payments service

    this.logger.log(
      `Processing subscription cancelled for payment ${data.payload.paymentId}`,
    );

    // For now, just log the data
    this.logger.log(
      `Subscription cancellation data: ${JSON.stringify(data.payload)}`,
    );
  }
}
