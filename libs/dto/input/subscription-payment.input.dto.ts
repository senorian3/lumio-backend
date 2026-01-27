import { IsNumber, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class InputCreateSubscriptionPaymentDto {
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
  @Transform(({ value }) => value.trim().toLowerCase()) // Нормализация значения
  @IsIn(['1 week', '2 weeks', '1 month'], {
    message:
      'Invalid subscription type. Must be one of: 1 week, 2 week, 1 month',
  })
  subscriptionType: '1 week' | '2 weeks' | '1 month';

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;
}
