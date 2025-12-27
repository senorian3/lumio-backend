import { PickType } from '@nestjs/swagger';
import { InputCreatePostDto } from './create-post.input.dto';

export class InputUpdatePostDto extends PickType(InputCreatePostDto, [
  'description',
] as const) {}
