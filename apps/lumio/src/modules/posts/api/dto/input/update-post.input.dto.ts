import { IsString, MaxLength, MinLength } from 'class-validator';

export class InputUpdatePostType {
  @IsString()
  @MaxLength(500)
  @MinLength(6)
  description: string;

  files: any;

  isAttaching: boolean;
}
