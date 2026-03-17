import { IsString, IsNotEmpty, IsIn, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InputCreateSubscriptionPaymentDto {
  @ApiProperty({
    description: 'Unique profile identifier of the user',
    example: '56',
    required: true,
    nullable: false,
  })
  @IsString({
    message: 'Profile ID must be a numeric string',
  })
  @IsNumberString({}, { message: 'Profile ID must be a numeric string' })
  @IsNotEmpty({
    message: 'Profile ID is required',
  })
  profileId: string;

  @ApiProperty({
    description: 'Currency code for the payment',
    example: 'USD',
    required: true,
    nullable: false,
  })
  @IsString({
    message: 'Currency must be a string',
  })
  @IsNotEmpty({
    message: 'Currency is required',
  })
  currency: string;

  @ApiProperty({
    description: 'Subscription duration type',
    example: '1 month',
    required: true,
    nullable: false,
    enum: ['1 week', '2 weeks', '1 month', '3 months', '1 year'],
  })
  @IsString({
    message: 'Subscription type must be a string',
  })
  @IsNotEmpty({
    message: 'Subscription type is required',
  })
  @IsIn(['1 week', '2 weeks', '1 month', '3 months', '1 year'], {
    message:
      'Invalid subscription type. Must be one of: 1 week, 2 weeks, 1 month, 3 months, 1 year',
  })
  subscriptionType: '1 week' | '2 weeks' | '1 month' | '3 months' | '1 year';

  @ApiProperty({
    description: 'Payment provider name',
    example: 'Stripe',
    required: true,
    nullable: false,
  })
  @IsString({
    message: 'Payment provider must be a string',
  })
  @IsNotEmpty({
    message: 'Payment provider is required',
  })
  paymentProvider: string;
}
