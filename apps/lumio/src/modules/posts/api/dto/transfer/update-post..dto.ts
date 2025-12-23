import { OutputFileType } from '@libs/dto/ouput/file-ouput';

export class UpdatePostDto {
  description: string;
  files: OutputFileType[];
}
