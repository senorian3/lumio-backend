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
  @IsIn(['1 week', '2 weeks', '1 month'], {
    message:
      'Invalid subscription type. Must be one of: 1 week, 2 week, 1 month',
  })
  subscriptionType: '1 week' | '2 weeks' | '1 month';

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;
}
