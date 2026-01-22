import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private successUrl: string;
  private cancelUrl: string;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    this.successUrl = process.env.SUCSSES_URL;

    this.cancelUrl = process.env.CANCEL_URL;

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      appInfo: {
        name: 'YourApp',
        version: '1.0.0',
      },
    });
  }

  async createPaymentUrl(subscriptionType: string, amount: number) {
    console.log(this.successUrl + '               successUrl');
    console.log(this.cancelUrl + '                     cancelUrl');

    const session = await this.stripe.checkout.sessions.create({
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
      line_items: [
        {
          price_data: {
            product_data: {
              name: `Subscription`,
              description: `Subscription for a period of ${subscriptionType}`,
            },
            unit_amount: amount * 100,
            currency: 'USD',
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
    });
    return session;
  }
}
