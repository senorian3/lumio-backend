import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  RawBodyRequest,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSubscriptionPaymentCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';
import { ChangeAutoRenewalSubscriptionCommand } from '../application/commands/change-subscription-autorenewal.command-handler';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';
import { ApiCreateSubscriptionPayment } from '@payments/core/decorators/swagger/subscription-payments/create-subscription-payment.decorator';
import { ApiChangeAutorenewal } from '@payments/core/decorators/swagger/subscription-payments/change-autorenewal.decorator';
import { ApiStripeHook } from '@payments/core/decorators/swagger/subscription-payments/stripe-hook.decorator';
import { ApiPaymentSuccess } from '@payments/core/decorators/swagger/subscription-payments/payment-success.decorator';
import { ApiPaymentError } from '@payments/core/decorators/swagger/subscription-payments/payment-error.decorator';
import {
  SUBSCRIPTION_PAYMENTS_BASE,
  SUBSCRIPTION_PAYMENTS_ROUTES,
} from '@payments/core/routes/subscription-payments-routes';

@Controller(SUBSCRIPTION_PAYMENTS_BASE)
export class SubscriptionPaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(SUBSCRIPTION_PAYMENTS_ROUTES.CREATE_PAYMENT_URL)
  @ApiCreateSubscriptionPayment()
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

  @Patch(SUBSCRIPTION_PAYMENTS_ROUTES.CHANGE_AUTORENEWAL)
  @ApiChangeAutorenewal()
  @UseGuards(InternalApiGuard)
  async changeAutorenwal(
    @Body() payload: InputChangeAutorenewalSubscriptionDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangeAutoRenewalSubscriptionCommand(payload),
    );
  }

  @Get(SUBSCRIPTION_PAYMENTS_ROUTES.SUCCESS)
  @ApiPaymentSuccess()
  success(): string {
    return 'Success url';
  }

  @Get(SUBSCRIPTION_PAYMENTS_ROUTES.ERROR)
  @ApiPaymentError()
  error(): string {
    return 'Error url';
  }

  @Post(SUBSCRIPTION_PAYMENTS_ROUTES.STRIPE_HOOK)
  @ApiStripeHook()
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
