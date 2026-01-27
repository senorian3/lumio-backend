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
import { SubscriptionCommand } from '@payments/modules/subscription-payments/application/commands/subscription.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscription-payments/application/commands/stripe-hook.command-handler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';

@Controller('subscription-payments')
@UseGuards(InternalApiGuard)
export class SubscriptionPaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createSubscriptionPaymentUrl(
    @Body() payload: InputCreateSubscriptionPaymentDto,
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
