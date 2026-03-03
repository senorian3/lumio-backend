import { IsString } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { InputRegistrationDto } from './registration.input.dto';

export class InputNewPasswordDto extends PickType(InputRegistrationDto, [
  'password',
] as const) {
  @IsString({
    message: 'Recovery code must be a string',
  })
  @ApiProperty({
    description: 'recoveryCode must be a string',
    example: '675b54ff-5271-44e4-91ac-a4ec9c1899d2',
    required: true,
    nullable: false,
  })
  recoveryCode: string;
}
