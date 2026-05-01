import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { CoreConfig } from '@payments/core/core.config';
import { SubscriptionType } from '@libs/core/types/subscription-type';
import { subscriptionConfigs } from '../../constants/stripe-constants';

@Injectable()
export class StripeAdapter {
  private stripe: Stripe;
  constructor(private readonly coreConfig: CoreConfig) {
    this.stripe = new Stripe(this.coreConfig.stripeApiKey, {
      apiVersion: '2025-12-15.clover',
      appInfo: {
        name: 'Incgram',
        version: '1.0.0',
      },
    });
  }

  async createPaymentSession(
    subscriptionType: SubscriptionType,
    amount: number,
    profileId: string,
    currency: string,
    subscriptionId: string,
    localhostOrigin?: string,
  ): Promise<Stripe.Checkout.Session> {
    const config = subscriptionConfigs[subscriptionType];

    const successUrl = localhostOrigin
      ? `${localhostOrigin}/settings?part=account&payment=success`
      : this.coreConfig.stripeSuccessUrl;
    const cancelUrl = localhostOrigin
      ? `${localhostOrigin}/settings?part=account&payment=error`
      : this.coreConfig.stripeCancelUrl;

    try {
      const nowDate = Date.now();
      const expiresAt = Math.floor(nowDate / 1000) + 3600;

      const session = await this.stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          profileId: profileId,
          customPaymentId: `${profileId}-${nowDate}`,
          subscriptionType: subscriptionType,
          mainSubscriptionId: subscriptionId,
        },
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Бизнес подписка',
                description: `Подписка на ${config.description}`,
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
        billing_address_collection: 'auto',
        payment_method_types: ['card'],
        expires_at: expiresAt,
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  async verify(rawBody: any, signature: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.coreConfig.stripeEndpointSecret,
      );
    } catch (error) {
      throw error;
    }
  }

  async getSubscriptionDetails(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      throw error;
    }
  }

  async changeSubscriptionAutoRenewal(
    subscriptionId: string,
    autoRenewal: boolean,
  ): Promise<void> {
    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !autoRenewal,
      });
    } catch (error) {
      throw error;
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    try {
      await this.stripe.checkout.sessions.expire(sessionId);
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscriptionImmediately(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        metadata: {
          cancelled_by: 'system',
          cancelled_at: new Date().toISOString(),
        },
      });

      await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      throw error;
    }
  }

  async updateCustomerSubscriptionEndDate(
    subscriptionId: string,
    customPeriodDateEnd: number,
    autoRenewal: boolean,
  ): Promise<void> {
    try {
      if (autoRenewal) {
        await this.stripe.subscriptions.update(subscriptionId, {
          trial_end: customPeriodDateEnd,
          proration_behavior: 'none',
        });
      } else {
        await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at: customPeriodDateEnd,
          proration_behavior: 'none',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async updateSubscriptionMetadata(
    subscriptionId: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        metadata,
      });
    } catch (error) {
      throw error;
    }
  }
}
