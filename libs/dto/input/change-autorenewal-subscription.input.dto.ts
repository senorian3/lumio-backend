import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InputChangeAutorenewalSubscriptionDto {
  @ApiProperty({
    description: 'Unique profile identifier of the user',
    example: '56',
    required: true,
    nullable: false,
  })
  @IsString({
    message: 'Profile ID must be a string',
  })
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
