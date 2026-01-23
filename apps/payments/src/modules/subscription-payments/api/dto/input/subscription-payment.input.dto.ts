import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubscriptionPaymentInputDto {
  @IsNumber()
  @IsNotEmpty()
  profileId: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value)) // ← Принудительное преобразование
  amount: number;

  @IsString()
  @IsNotEmpty()
  subscriptionType: string;

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;
}
