import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InputRegistrationConfirmationDto {
  @ApiProperty({
    description: 'Confirmation code for registration',
    example: '675b54ff-5271-44e4-91ac-a4ec9c1899d2',
    required: true,
    nullable: false,
  })
  @IsString()
  confirmCode: string;
}
