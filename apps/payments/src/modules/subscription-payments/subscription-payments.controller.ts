import { Body, Controller, Post } from '@nestjs/common';

@Controller('subscription-payments')
export class SubscriptionPaymentsController {
  @Post()
  createSubscriptionPayment(@Body() payload: any) {
    return payload;
  }
}
