import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { SubscriptionType } from '@libs/core/types/subscription-type';

export class InputCreateSubscriptionPaymentUrlDto {
  @IsNumberString()
  @IsNotEmpty()
  profileId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(SubscriptionType)
  subscriptionType: SubscriptionType;

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;

  @IsString()
  @IsOptional()
  localhostOrigin?: string;
}
