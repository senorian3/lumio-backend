import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class InputUploadFilesDto {
  @IsString()
  postId: string;

  @Type(() => Number)
  @IsNumber()
  userId: number;
}
