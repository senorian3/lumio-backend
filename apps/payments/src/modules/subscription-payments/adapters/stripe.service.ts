import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

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

    this.successUrl = process.env.SUCSSES_URL;

    this.cancelUrl = process.env.CANCEL_URL;

    this.endpointSecret = process.env.ENDPOINT_SECRET;

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      appInfo: {
        name: 'YourApp',
        version: '1.0.0',
      },
    });
  }

  async createPaymentSession(
    subscriptionType: string,
    amount: number,
    paymentId: number,
    currency: string,
  ) {
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
            currency: currency,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: paymentId.toString(),

      payment_intent_data: {
        metadata: {
          paymentId: paymentId.toString(),
        },
      },
    });
    return session;
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
}
