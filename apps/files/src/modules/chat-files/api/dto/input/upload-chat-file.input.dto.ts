import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum ChatFileType {
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  DOCUMENT = 'DOCUMENT',
}

export class UploadChatFileInputDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'The "userId" field must be a number' })
  @IsNotEmpty({ message: 'The "userId" field cannot be empty' })
  @IsPositive({ message: 'The "userId" must be a positive number' })
  userId: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'The "chatId" field must be a number' })
  @IsNotEmpty({ message: 'The "chatId" field cannot be empty' })
  @IsPositive({ message: 'The "chatId" must be a positive number' })
  chatId: number;

  @IsString({ message: 'The "messageId" field must be a string' })
  @IsNotEmpty({ message: 'The "messageId" field cannot be empty' })
  messageId: string;

  @IsEnum(ChatFileType, {
    message: 'The "fileType" must be one of: IMAGE, VOICE, DOCUMENT',
  })
  @IsNotEmpty({ message: 'The "fileType" field cannot be empty' })
  fileType: ChatFileType;

  @IsOptional()
  @IsString({ message: 'The "text" field must be a string' })
  text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "duration" field must be a number' })
  @IsPositive({ message: 'The "duration" must be a positive number' })
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "width" field must be a number' })
  @IsPositive({ message: 'The "width" must be a positive number' })
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'The "height" field must be a number' })
  @IsPositive({ message: 'The "height" must be a positive number' })
  height?: number;
}
