import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import { subscriptionConfigs } from '../../constants/stripe-constants';
import { CoreConfig } from '@payments/core/core.config';

@Injectable()
export class StripeAdapter {
  private stripe: Stripe;
  constructor(
    private readonly logger: AppLoggerService,
    private readonly coreConfig: CoreConfig,
  ) {
    this.stripe = new Stripe(this.coreConfig.stripeApiKey, {
      apiVersion: '2025-12-15.clover',
      appInfo: {
        name: 'Incgram',
        version: '1.0.0',
      },
    });
  }

  async createPaymentSession(
    subscriptionType: '1 week' | '2 weeks' | '1 month',
    amount: number,
    profileId: string,
    currency: string,
    billingCycleAnchor?: number,
  ): Promise<Stripe.Checkout.Session> {
    const config = subscriptionConfigs[subscriptionType];

    try {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      const session = await this.stripe.checkout.sessions.create({
        success_url: this.coreConfig.stripeSuccessUrl,
        cancel_url: this.coreConfig.stripeCancelUrl,
        metadata: {
          customPaymentId: `${profileId}-${Date.now()}`,
          subscriptionType: subscriptionType,
        },
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Бизнес подписка',
                description: `Подписка на ${config.description} с автоматическим продлением`,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: config.interval,
                interval_count: config.intervalCount,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        client_reference_id: profileId.toString(),

        subscription_data: {
          ...(billingCycleAnchor && {
            billing_cycle_anchor: billingCycleAnchor,
            proration_behavior: 'none' as const,
          }),
        },

        billing_address_collection: 'auto',
        payment_method_types: ['card'],

        expires_at: expiresAt,
      });

      return session;
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to create payment session with profileId=${profileId}: ${error.message}`,
        'createPaymentSession',
      );
    }
  }

  async verify(rawBody: any, signature: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.coreConfig.stripeEndpointSecret,
      );
    } catch (err) {
      this.logger.error(
        `Error verifying webhook: ${err.message}`,
        err.stack,
        'StripeService',
      );
      throw BadRequestDomainException.create(
        'Verification endpoint failed',
        'verify',
      );
    }
  }

  async getSubscriptionDetails(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to retrieve subscription details: ${error.message}`,
        'getSubscriptionDetails',
      );
    }
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async enableSubscriptionAutoRenewal(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async cancelSession(sessionId: string): Promise<void> {
    try {
      await this.stripe.checkout.sessions.expire(sessionId);
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to cancel session: ${error.message}`,
        'cancelSession',
      );
    }
  }

  async cancelSubscriptionImmediately(subscriptionId: string): Promise<void> {
    try {
      const req = await this.stripe.subscriptions.cancel(subscriptionId);
      console.log(req);
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to cancel subscription immediately: ${error.message}`,
        'cancelSubscriptionImmediately',
      );
    }
  }
}
