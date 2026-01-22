import { Body, Controller, Get, Post } from '@nestjs/common';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';

@Controller('subscription-payments')
export class SubscriptionPaymentsController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  async createSubscriptionPayment(@Body() payload: any) {
    const session = await this.stripeService.createPaymentUrl(
      payload.subscriptionType,
      +payload.amount,
    );

    return { url: session.url };
  }

  @Get('success')
  success(): string {
    return 'you bye';
  }

  @Get('error')
  error(): string {
    return 'ты не купил';
  }
}
