import {
  IsString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class InputCreateSubscriptionPaymentUrlDto {
  @IsNumberString()
  @IsNotEmpty()
  profileId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsIn(['1 week', '2 weeks', '1 month', '3 months', '1 year'])
  subscriptionType: '1 week' | '2 weeks' | '1 month' | '3 months' | '1 year';

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;

  @IsString()
  @IsOptional()
  localhostOrigin?: string;
}
