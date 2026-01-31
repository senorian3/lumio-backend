import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import { subscriptionConfigs } from '../../constants/stripe-constants';

@Injectable()
export class StripeAdapter {
  private readonly stripe: Stripe;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly endpointSecret: string;

  constructor(private readonly logger: AppLoggerService) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    this.successUrl = process.env.SUCCESS_URL;

    this.cancelUrl = process.env.CANCEL_URL;

    this.endpointSecret = process.env.ENDPOINT_SECRET;

    this.stripe = new Stripe(apiKey, {
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
    paymentId: number,
    currency: string,
    trialEnd?: number,
  ) {
    if (!subscriptionConfigs[subscriptionType]) {
      throw BadRequestDomainException.create(
        'Subscription type is not supported',
        'subscriptionType',
      );
    }

    const config = subscriptionConfigs[subscriptionType];

    try {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      const session = await this.stripe.checkout.sessions.create({
        success_url: this.successUrl,
        cancel_url: this.cancelUrl,
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
        client_reference_id: paymentId.toString(),

        subscription_data: {
          metadata: {
            paymentId: paymentId.toString(),
            subscriptionType: subscriptionType,
          },
          ...(trialEnd && {
            trial_end: trialEnd,
          }),
        },

        billing_address_collection: 'auto',
        payment_method_types: ['card'],

        expires_at: expiresAt,
      });

      return session;
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to create payment session with paymentId=${paymentId}: ${error.message}`,
        'createPaymentSession',
      );
    }
  }

  async verify(rawBody: any, signature: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.endpointSecret,
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
      cancel_at_period_end: true,
    });
  }

  async enableSubscriptionAutoRenewal(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }
}
