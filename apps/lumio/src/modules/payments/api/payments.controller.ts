import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { CreateSubscriptionPaymentUrlCommand } from '../application/commands/create-subscription.command-handler';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';
import { ChangeAutoRenewalCommand } from '../application/commands/change-autorenewal.command.handler';
import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { GetUserPaymentsQuery } from '@lumio/modules/payments/application/queries/get-user-payments.query-handler';

@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  //@ApiGetSubscriptionPaymentUrl()
  @HttpCode(HttpStatus.OK)
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

  @Post('autorenewal')
  // @ApiChangeAutorenewalSubscription()
  @HttpCode(HttpStatus.OK)
  async updateAutoRenewal(
    @Req() req: any,
    @Body() dto: InputChangeAutorenewalSubscriptionDto,
  ): Promise<void> {
    await this.commandBus.execute<ChangeAutoRenewalCommand, void>(
      new ChangeAutoRenewalCommand(+req.user.userId, dto),
    );
  }

  @Get('me')
  async getUserPayments(
    @Query()
    query: GetUserPaymentsParams,
    @Req() req: any,
  ): Promise<any> {
    return await this.queryBus.execute<GetUserPaymentsQuery, void>(
      new GetUserPaymentsQuery(+req.user.userId, query),
    );
  }
}
