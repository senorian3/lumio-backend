import {
  Body,
  Controller,
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

@UseGuards(ThrottlerGuard)
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
    >(new CreateSubscriptionPaymentUrlCommand(req.user.userId, dto));

    return { url };
  }
}
