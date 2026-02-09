import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class InputChangeAutorenewalSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @IsBoolean()
  @IsNotEmpty()
  autoRenewal: boolean;
}
