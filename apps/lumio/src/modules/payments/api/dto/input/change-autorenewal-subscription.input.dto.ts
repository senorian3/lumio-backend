import { IsNotEmpty, IsBoolean, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InputChangeAutorenewalSubscriptionDto {
  @ApiProperty({
    description: 'Unique profile identifier of the user (numeric string)',
    example: '56',
    type: String,
    pattern: '^[0-9]+$',
    required: true,
    nullable: false,
  })
  @IsNumberString(
    {},
    {
      message: 'Profile ID must be a numeric string',
    },
  )
  @IsNotEmpty({
    message: 'Profile ID is required',
  })
  profileId: string;

  @ApiProperty({
    description: 'Auto-renewal status for the subscription',
    example: true,
    required: true,
    nullable: false,
  })
  @IsBoolean({
    message: 'Auto-renewal must be a boolean value',
  })
  @IsNotEmpty({
    message: 'Auto-renewal is required',
  })
  autoRenewal: boolean;
}
