import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class InputCreateSubscriptionPaymentDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['1 week', '2 weeks', '1 month', '3 months', '1 year'], {
    message:
      'Invalid subscription type. Must be one of: 1 week, 2 weeks, 1 month, 3 months, 1 year',
  })
  subscriptionType: '1 week' | '2 weeks' | '1 month' | '3 months' | '1 year';

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;
}
