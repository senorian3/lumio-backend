import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

const subscriptionConfigs = {
  '1 week': {
    interval: 'week' as const,
    intervalCount: 1,
    description: '1 неделю',
  },
  '2 weeks': {
    interval: 'week' as const,
    intervalCount: 2,
    description: '2 недели',
  },
  '1 month': {
    interval: 'month' as const,
    intervalCount: 1,
    description: '1 месяц',
  },
};

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private successUrl: string;
  private cancelUrl: string;
  private endpointSecret: string;

  constructor() {
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
      throw new Error(
        `Unsupported subscription type: ${subscriptionType}. Supported types: ${Object.keys(subscriptionConfigs).join(', ')}`,
      );
    }

    const config = subscriptionConfigs[subscriptionType];

    try {
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
      });

      return session;
    } catch (error) {
      console.error('Stripe session creation failed:', error);
      throw new Error(`Payment session creation failed: ${error.message}`);
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
      console.error(err);
      throw BadRequestDomainException.create('verify endpoint error', 'verify');
    }
  }

  async getSubscriptionDetails(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      throw new Error(
        `Failed to retrieve subscription details: ${error.message}`,
      );
    }
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}
