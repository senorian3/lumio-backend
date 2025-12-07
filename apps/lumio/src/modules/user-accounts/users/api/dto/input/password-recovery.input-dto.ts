import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { InputRegistrationDto } from './registration.input-dto';

export class InputPasswordRecoveryDto extends PickType(InputRegistrationDto, [
  'email',
] as const) {
  @ApiProperty({
    description: 'Recaptcha token',
    example: '6LfsdsdSSEsAAAAALfsdfDmlRycmKgdsfgAlcxKEp2w1Vm',
    required: true,
    nullable: false,
  })
  @IsString()
  recaptchaToken: string;
}
