import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentInputDto {
  @IsString()
  @MinLength(1, {
    message: 'Комментарий не может быть пустым',
  })
  @MaxLength(300, {
    message: 'Комментарий не может быть длиннее 300 символов',
  })
  content: string;
}
