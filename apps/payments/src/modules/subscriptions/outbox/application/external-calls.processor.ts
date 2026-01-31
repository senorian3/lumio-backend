import { Injectable } from '@nestjs/common';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxMessage } from 'generated/prisma-payments';

@Injectable()
export class ExternalCallsProcessor {
  constructor(
    private readonly stropeAdapter: StripeAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async processCancelSubscription(message: OutboxMessage): Promise<boolean> {
    const payload = message.payload as {
      subscriptionId: string;
    };

    try {
      await this.stropeAdapter.cancelSubscriptionAtPeriodEnd(
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
