import { Injectable } from '@nestjs/common';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxMessage } from 'generated/prisma-payments';

@Injectable()
export class ExternalCallsProcessor {
  constructor(
    private readonly stripeService: StripeService,
    private readonly logger: AppLoggerService,
  ) {}

  async processCancelSubscription(message: OutboxMessage): Promise<boolean> {
    const payload = message.payload as {
      paymentId: number;
      subscriptionId: string;
      timestamp: string;
    };

    try {
      await this.stripeService.cancelSubscriptionAtPeriodEnd(
        payload.subscriptionId,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        'ExternalCallsProcessor',
      );
      return false;
    }
  }
}
