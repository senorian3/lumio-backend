import { IsString } from 'class-validator';

export class InputUploadFilesDto {
  @IsString()
  postId: string;
}
