import { IsString, IsNotEmpty } from 'class-validator';

export class InputCancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;
}
