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
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateSubscriptionPaymentCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { Request } from 'express';
import { StripeHookCommand } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';
import { StripeWebhookGuard } from '@payments/core/guards/webhook/stripe-webhook.guard';
import { ChangeAutoRenewalSubscriptionCommand } from '../application/commands/change-subscription-autorenewal.command-handler';
import { ApiCreateSubscriptionPayment } from '@payments/core/decorators/swagger/subscription-payments/create-subscription-payment.decorator';
import { ApiChangeAutorenewal } from '@payments/core/decorators/swagger/subscription-payments/change-autorenewal.decorator';
import { ApiStripeHook } from '@payments/core/decorators/swagger/subscription-payments/stripe-hook.decorator';
import { ApiPaymentSuccess } from '@payments/core/decorators/swagger/subscription-payments/payment-success.decorator';
import { ApiPaymentError } from '@payments/core/decorators/swagger/subscription-payments/payment-error.decorator';
import { ApiGetUserProfilePayments } from '@payments/core/decorators/swagger/subscription-payments/get-user-profile-payments.decorator';
import {
  SUBSCRIPTION_PAYMENTS_BASE,
  SUBSCRIPTION_PAYMENTS_ROUTES,
} from '@payments/core/routes/subscription-payments-routes';
import { GetUserProfilePaymentsQuery } from '../application/queries/get-user-profile-payments.query-handler';
import { InputCreateSubscriptionPaymentUrlDto } from './dto/input/input-create-subscription-payment-url.dto';
import { InputChangeAutorenewalSubscriptionPaymentDto } from './dto/input/input-update-autorenewal.dto';
import { GetAllPaymentsQuery } from '@payments/modules/subscriptions/subscription-payments/application/queries/get-all-payments.query-handler';

@Controller(SUBSCRIPTION_PAYMENTS_BASE)
export class SubscriptionPaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(SUBSCRIPTION_PAYMENTS_ROUTES.PROFILE_PAYMENTS)
  @ApiGetUserProfilePayments()
  //@UseGuards(InternalApiGuard)
  async getUserProfilePayments(
    @Query('profileId') profileId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.queryBus.execute(
      new GetUserProfilePaymentsQuery(profileId, page, limit),
    );

    return {
      items: result.items,
      total: result.totalCount,
      page,
      limit,
    };
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

  @Post(SUBSCRIPTION_PAYMENTS_ROUTES.CREATE_PAYMENT_URL)
  @ApiCreateSubscriptionPayment()
  @UseGuards(InternalApiGuard)
  async createSubscriptionPaymentUrl(
    @Body() payload: InputCreateSubscriptionPaymentUrlDto,
  ): Promise<{ url: string }> {
    const paymentsUrl = await this.commandBus.execute<
      CreateSubscriptionPaymentCommand,
      string
    >(new CreateSubscriptionPaymentCommand(payload));

    return { url: paymentsUrl };
  }

  @Post(SUBSCRIPTION_PAYMENTS_ROUTES.STRIPE_HOOK)
  @ApiStripeHook()
  @UseGuards(StripeWebhookGuard)
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

  @Patch(SUBSCRIPTION_PAYMENTS_ROUTES.CHANGE_AUTORENEWAL)
  @ApiChangeAutorenewal()
  @UseGuards(InternalApiGuard)
  async changeAutorenwal(
    @Body() payload: InputChangeAutorenewalSubscriptionPaymentDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangeAutoRenewalSubscriptionCommand(payload),
    );
  }

  @Get(SUBSCRIPTION_PAYMENTS_ROUTES.ALL_PAYMENTS)
  async getAllPayments(
    @Query('profileIds') profileIds?: string | string[],
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
  ) {
    const profileIdsArray = profileIds
      ? Array.isArray(profileIds)
        ? profileIds.map((id) => parseInt(id, 10))
        : [parseInt(profileIds, 10)]
      : undefined;

    const result = await this.queryBus.execute(
      new GetAllPaymentsQuery(
        profileIdsArray,
        skip ? parseInt(skip, 10) : 0,
        take ? parseInt(take, 10) : 10,
        sortBy || 'createdAt',
        sortOrder || 'desc',
        search,
      ),
    );

    return result;
  }
}
