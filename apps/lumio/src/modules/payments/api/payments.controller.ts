import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { CreateSubscriptionPaymentUrlCommand } from '../application/commands/create-subscription.command-handler';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';
import { ChangeAutoRenewalCommand } from '../application/commands/change-autorenewal.command.handler';

@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly commandBus: CommandBus) {}

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

  @Get()
  async getUserPayments(): Promise<void> {}
}
