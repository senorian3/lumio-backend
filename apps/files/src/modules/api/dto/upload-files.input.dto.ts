import { IsString } from 'class-validator';

export class InputUploadFilesType {
  @IsString()
  postId: string;
}
