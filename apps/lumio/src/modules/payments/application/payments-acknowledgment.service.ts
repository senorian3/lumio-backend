import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AppLoggerService } from '@libs/logger/logger.service';
import { lastValueFrom } from 'rxjs';

export interface PaymentAcknowledgment {
  messageId: number;
  paymentId: number;
  status: 'received' | 'processed';
  timestamp: Date;
  details?: string;
}

@Injectable()
export class PaymentsAcknowledgmentService {
  constructor(
    @Inject('PAYMENTS_SERVICE') private readonly paymentsService: ClientProxy,
    private readonly logger: AppLoggerService,
  ) {}

  async sendPaymentAcknowledgment(
    messageId: number,
    paymentId: number,
    status: 'received' | 'processed',
    details?: string,
  ): Promise<void> {
    try {
      const acknowledgment: PaymentAcknowledgment = {
        messageId,
        paymentId,
        status,
        timestamp: new Date(),
        details,
      };

      // Send acknowledgment to Payments service
      await lastValueFrom(
        this.paymentsService.emit('payment.acknowledgment', acknowledgment),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send acknowledgment for message ${messageId}: ${error.message}`,
        error.stack,
        'PaymentsAcknowledgment',
      );
      throw error;
    }
  }

  async sendPaymentCompletedAcknowledgment(
    messageId: number,
    paymentId: number,
  ): Promise<void> {
    await this.sendPaymentAcknowledgment(
      messageId,
      paymentId,
      'processed',
      'Payment successfully processed and subscription updated',
    );
  }

  async sendPaymentFailedAcknowledgment(
    messageId: number,
    paymentId: number,
    error: string,
  ): Promise<void> {
    await this.sendPaymentAcknowledgment(
      messageId,
      paymentId,
      'processed',
      `Payment failed: ${error}`,
    );
  }

  async sendSubscriptionCancelledAcknowledgment(
    messageId: number,
    paymentId: number,
  ): Promise<void> {
    await this.sendPaymentAcknowledgment(
      messageId,
      paymentId,
      'processed',
      'Subscription cancellation processed',
    );
  }
}
