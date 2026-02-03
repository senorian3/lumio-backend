import {
  Body,
  Controller,
  Get,
  Post,
  RawBodyRequest,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSubscriptionPaymentCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { CancelSubscriptionCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/cancel-subscription.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { InputCancelSubscriptionDto } from '@libs/dto/input/cancel-subscription.input.dto';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';

@Controller('subscription-payments')
export class SubscriptionPaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @UseGuards(InternalApiGuard)
  async createSubscriptionPaymentUrl(
    @Body() payload: InputCreateSubscriptionPaymentDto,
  ): Promise<{ url: string }> {
    const paymentsUrl = await this.commandBus.execute<
      CreateSubscriptionPaymentCommand,
      string
    >(new CreateSubscriptionPaymentCommand(payload));

    return { url: paymentsUrl };
  }

  @Post('cancel')
  // @UseGuards(InternalApiGuard)
  async cancelSubscription(
    @Body() payload: InputCancelSubscriptionDto,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new CancelSubscriptionCommand(payload));

    return { success: true };
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
