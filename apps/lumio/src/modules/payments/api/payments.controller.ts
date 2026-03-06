import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CreateSubscriptionPaymentUrlCommand } from '../application/commands/create-subscription.command-handler';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ChangeAutoRenewalCommand } from '../application/commands/change-autorenewal.command.handler';
import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { GetUserPaymentsQuery } from '@lumio/modules/payments/application/queries/get-user-payments.query-handler';
import { GetUserSubscriptionQuery } from '../application/queries/get-user-subscription.query-handler';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { PaymentViewDto } from '@lumio/modules/payments/api/dto/output/user-payment.output.dto';
import {
  PAYMENTS_BASE,
  PAYMENTS_ROUTES,
} from '@lumio/core/routes/payment-routes';
import { OutputUserSubscriptionDto } from './dto/output/user-subscription.output.dto';
import { ApiCreateSubscriptionPaymentUrl } from '@lumio/core/decorators/swagger/payments/create-payment-url.decorator';
import { ApiUpdateAutoRenewal } from '@lumio/core/decorators/swagger/payments/update-auto-renewal.decorator';
import { ApiGetUserPayments } from '@lumio/core/decorators/swagger/payments/get-user-payments.decorator';
import { ApiGetUserSubscription } from '@lumio/core/decorators/swagger/payments/get-user-subscription.decorator';
import { InputCreateSubscriptionPaymentDto } from './dto/input/subscription-create.input.dto';
import { InputChangeAutorenewalSubscriptionDto } from './dto/input/change-autorenewal-subscription.input.dto';

@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Controller(PAYMENTS_BASE)
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiCreateSubscriptionPaymentUrl()
  async getSubscriptionPaymentUrl(
    @Req() req: any,
    @Body() dto: InputCreateSubscriptionPaymentDto,
  ): Promise<{ url: string }> {
    const url: string = await this.commandBus.execute<
      CreateSubscriptionPaymentUrlCommand,
      string
    >(new CreateSubscriptionPaymentUrlCommand(+req.user.userId, dto));

    return { url };
  }

  @Patch(PAYMENTS_ROUTES.AUTORENEWAL)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateAutoRenewal()
  async updateAutoRenewal(
    @Req() req: any,
    @Body() dto: InputChangeAutorenewalSubscriptionDto,
  ): Promise<void> {
    await this.commandBus.execute<ChangeAutoRenewalCommand, void>(
      new ChangeAutoRenewalCommand(+req.user.userId, dto),
    );
  }

  @Get(PAYMENTS_ROUTES.MY_PAYMENTS)
  @ApiGetUserPayments()
  async getUserPayments(
    @Query()
    query: GetUserPaymentsParams,
    @Req() req: any,
  ): Promise<PaginatedViewDto<PaymentViewDto[]>> {
    return await this.queryBus.execute<
      GetUserPaymentsQuery,
      PaginatedViewDto<PaymentViewDto[]>
    >(new GetUserPaymentsQuery(+req.user.userId, query));
  }

  @Get(PAYMENTS_ROUTES.MY_SUBSCRIPTION)
  @ApiGetUserSubscription()
  async getUserSubscription(
    @Req() req: any,
  ): Promise<OutputUserSubscriptionDto> {
    return await this.queryBus.execute<
      GetUserSubscriptionQuery,
      OutputUserSubscriptionDto
    >(new GetUserSubscriptionQuery(+req.user.userId));
  }
}
