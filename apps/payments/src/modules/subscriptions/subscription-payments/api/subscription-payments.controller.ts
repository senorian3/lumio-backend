import {
  Body,
  Controller,
  Get,
  Post,
  RawBodyRequest,
  Req,
  Headers,
  UseGuards,
  Put,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSubscriptionPaymentCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';
import { ChangeAutoRenewalSubscriptionCommand } from '../application/commands/change-subscription-autorenewal.command-handler';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';

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

  @Put('autorenewal')
  @UseGuards(InternalApiGuard)
  async changeAutorenwal(
    @Body() payload: InputChangeAutorenewalSubscriptionDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangeAutoRenewalSubscriptionCommand(payload),
    );
  }

  @Get('success')
  success(): string {
    return 'Success url';
  }

  @Get('error')
  error(): string {
    return 'Error url';
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
