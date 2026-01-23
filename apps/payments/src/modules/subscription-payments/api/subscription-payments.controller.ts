import {
  Body,
  Controller,
  Get,
  Post,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { SubscriptionPaymentInputDto } from '@payments/modules/subscription-payments/api/dto/input/subscription-payment.input.dto';
import { CommandBus } from '@nestjs/cqrs';
import { SubscriptionCommand } from '@payments/modules/subscription-payments/application/commands/subscription.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscription-payments/application/commands/stripe-hook.command-handler';

@Controller('subscription-payments')
export class SubscriptionPaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createSubscriptionPayment(
    @Body() payload: SubscriptionPaymentInputDto,
  ): Promise<{ url: string }> {
    const paymentsUrl = await this.commandBus.execute<
      SubscriptionCommand,
      string
    >(new SubscriptionCommand(payload));

    return { url: paymentsUrl };
  }

  @Get('success')
  success(): string {
    return 'ты купил';
  }

  @Get('error')
  error(): string {
    return 'ты не купил';
  }

  @Post('stripe-hook')
  async stripeHook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || req.body;

    await this.commandBus.execute(
      new StripeHookCommand(signature, rawBody as Buffer),
    );

    return { received: true };
  }
}
