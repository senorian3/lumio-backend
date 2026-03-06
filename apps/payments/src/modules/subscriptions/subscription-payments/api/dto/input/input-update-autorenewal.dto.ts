import {
  IsNumberString,
  IsNotEmpty,
  IsBoolean,
  IsString,
} from 'class-validator';

export class InputChangeAutorenewalSubscriptionPaymentDto {
  @IsNumberString()
  @IsNotEmpty()
  profileId: string;

  @IsBoolean()
  @IsNotEmpty()
  autoRenewal: boolean;

  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}
