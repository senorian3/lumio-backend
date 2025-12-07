import { PickType } from '@nestjs/swagger';
import { InputRegistrationDto } from './registration.input-dto';

export class InputLoginDto extends PickType(InputRegistrationDto, [
  'email',
  'password',
] as const) {}
